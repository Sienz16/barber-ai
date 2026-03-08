import type { HaircutSuggestion } from '$lib/types/haircut';

type FetchLike = typeof globalThis.fetch;

type BuildHaircutSuggestionsOptions = {
	selfie: File;
	apiKey: string;
	baseUrl: string;
	model: string;
	fetch: FetchLike;
};

type LlmSuggestion = {
	title: string;
	vibe: string;
	maintenance: string;
	reason: string;
	hairPrompt: string;
};

function slugifyTitle(title: string, index: number): string {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return `${slug || 'style'}-${index + 1}`;
}

function parseJsonContent(content: string): { suggestions: LlmSuggestion[] } {
	const trimmed = content.trim();
	const unwrapped = trimmed.startsWith('```')
		? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
		: trimmed;

	return JSON.parse(unwrapped) as { suggestions: LlmSuggestion[] };
}

function toBase64(bytes: Uint8Array): string {
	let binary = '';
	for (const value of bytes) {
		binary += String.fromCharCode(value);
	}
	return btoa(binary);
}

export async function buildHaircutSuggestions({
	selfie,
	apiKey,
	baseUrl,
	model,
	fetch
}: BuildHaircutSuggestionsOptions): Promise<HaircutSuggestion[]> {
	const bytes = new Uint8Array(await selfie.arrayBuffer());
	const dataUri = `data:${selfie.type || 'image/jpeg'};base64,${toBase64(bytes)}`;
	const endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model,
			messages: [
				{
					role: 'system',
					content:
						'You are an expert barber consultant. Analyze face structure, proportions, jaw/forehead balance, cheek width, profile shape, skin undertone, and hair density/texture from the selfie. Recommend exactly 4 hairstyles that best fit this person. Avoid trendy styles unless they are clearly suitable.'
				},
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Return JSON with key suggestions: array of 4 objects. Each object must include title, vibe, maintenance, reason, hairPrompt. hairPrompt should be generation-ready and describe only hairstyle details.'
						},
						{
							type: 'image_url',
							image_url: { url: dataUri }
						}
					]
				}
			],
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'haircut_suggestions',
					strict: true,
					schema: {
						type: 'object',
						additionalProperties: false,
						properties: {
							suggestions: {
								type: 'array',
								minItems: 4,
								maxItems: 4,
								items: {
									type: 'object',
									additionalProperties: false,
									properties: {
										title: { type: 'string' },
										vibe: { type: 'string' },
										maintenance: { type: 'string' },
										reason: { type: 'string' },
										hairPrompt: { type: 'string' }
									},
									required: ['title', 'vibe', 'maintenance', 'reason', 'hairPrompt']
								}
							}
						},
						required: ['suggestions']
					}
				}
			}
		})
	});

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(`Failed to generate AI haircut suggestions. Status: ${response.status}. ${body}`);
	}

	const payload = (await response.json()) as {
		choices?: Array<{ message?: { content?: string | null } }>;
	};

	const content = payload.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error('AI haircut analysis returned an empty response.');
	}

	const parsed = parseJsonContent(content);
	if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length !== 4) {
		throw new Error('AI haircut analysis must return exactly four suggestions.');
	}

	return parsed.suggestions.map((suggestion, index) => ({
		id: slugifyTitle(suggestion.title, index),
		panelLabel: (`0${index + 1}` as '01' | '02' | '03' | '04'),
		title: suggestion.title,
		vibe: suggestion.vibe,
		maintenance: suggestion.maintenance,
		reason: suggestion.reason,
		hairPrompt: suggestion.hairPrompt
	}));
}
