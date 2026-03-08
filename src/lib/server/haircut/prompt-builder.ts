import type { HaircutSuggestion } from '$lib/types/haircut';

const LEONARDO_MAX_PROMPT_CHARS = 1500;

function buildPrompt(
	suggestions: HaircutSuggestion[],
	maxHairPromptChars: number,
	includeAnalysisDirectives: boolean
): string {
	const panelInstructions = suggestions.map((suggestion) => {
		const compactHairPrompt = suggestion.hairPrompt.replace(/\s+/g, ' ').trim().slice(0, maxHairPromptChars);
		return `Panel ${suggestion.panelLabel}: ${compactHairPrompt}.`;
	});

	const analysisDirectives = includeAnalysisDirectives
		? [
				'Before choosing styles, analyze the face carefully: face shape, proportions, profile, hairline, and hair density.',
				'Do not pick trendy cuts unless they are the best fit; prioritize facial balance and proportion.'
			]
		: [];

	return [
		'Photorealistic 2x2 haircut collage in four panels.',
		'IDENTITY LOCK: Every panel must show the same person from the reference photo.',
		'Face and body must stay identical: same facial features, age, skin, and hairline.',
		'Body: identical clothing exactly as worn. Do not change, swap, or remove any clothing item.',
		'Expression: neutral and same as reference.',
		'same person, same outfit, same face.',
		'Camera: head-and-shoulders, same angle and lighting in every panel.',
		'Keep full head and upper shoulders visible; no tight crop.',
		'Frame and center the full face in each panel.',
		'Do not crop, cut off, or hide facial features.',
		'Pose: near-frontal or slight 3/4 toward camera, not profile.',
		'Each panel must be a clearly distinct hairstyle with different silhouette and side treatment.',
		'Do not repeat or make near-duplicate cuts across panels.',
		'Avoid extreme or ultra-short cuts unless explicitly requested by the user.',
		'Avoid dated or old-fashioned styles; keep recommendations modern and wearable.',
		'ONLY the hairstyle changes between panels.',
		'Do not beautify, retouch, add makeup, alter ethnicity, or reshape facial features.',
		...analysisDirectives,
		'Clean neutral studio background, clear borders, realistic photography.',
		...panelInstructions
	].join(' ');
}

export function buildSeedreamCollagePrompt(suggestions: HaircutSuggestion[]): string {
	const hairPromptBudgets = [90, 60, 45, 30, 20, 10];

	for (const maxHairPromptChars of hairPromptBudgets) {
		const prompt = buildPrompt(suggestions, maxHairPromptChars, true);
		if (prompt.length <= LEONARDO_MAX_PROMPT_CHARS) {
			return prompt;
		}
	}

	for (const maxHairPromptChars of hairPromptBudgets) {
		const prompt = buildPrompt(suggestions, maxHairPromptChars, false);
		if (prompt.length <= LEONARDO_MAX_PROMPT_CHARS) {
			return prompt;
		}
	}

	return buildPrompt(suggestions, 6, false).slice(0, LEONARDO_MAX_PROMPT_CHARS);
}
