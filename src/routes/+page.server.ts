import { fail } from '@sveltejs/kit';

import { buildSeedreamCollagePrompt } from '$lib/server/haircut/prompt-builder';
import { getHaircutAnalyzerConfig } from '$lib/server/haircut/env';
import { buildHaircutSuggestions } from '$lib/server/haircut/recommendation-engine';
import { createLeonardoClient } from '$lib/server/leonardo/client';
import { getLeonardoApiKey } from '$lib/server/leonardo/env';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isValidFile(value: FormDataEntryValue | null): value is File {
	return value instanceof File && value.size > 0;
}

export const actions = {
	generate: async ({ request, fetch }: { request: Request; fetch: typeof globalThis.fetch }) => {
		const formData = await request.formData();
		const selfie = formData.get('selfie');

		if (!isValidFile(selfie)) {
			return fail(400, { message: 'Please take a selfie first.' });
		}

		if (!ALLOWED_TYPES.has(selfie.type)) {
			return fail(400, { message: 'Use JPG, PNG, or WebP.' });
		}

		if (selfie.size > MAX_FILE_SIZE) {
			return fail(400, { message: 'Use an image under 10 MB.' });
		}

		const analyzer = getHaircutAnalyzerConfig();
		const suggestions = await buildHaircutSuggestions({
			selfie,
			apiKey: analyzer.apiKey,
			baseUrl: analyzer.baseUrl,
			model: analyzer.model,
			fetch
		});
		const prompt = buildSeedreamCollagePrompt(suggestions);

		try {
			const client = createLeonardoClient({
				apiKey: getLeonardoApiKey(),
				fetch
			});

			const uploadedImageId = await client.uploadReferenceImage(selfie);
			const generationId = await client.generateCollage({
				uploadedImageId,
				prompt,
				width: 768,
				height: 1152
			});
			const imageUrl = await client.waitForImage(generationId);

			return {
				success: true,
				result: {
					imageUrl,
					suggestions
				}
			};
		} catch (error) {
			console.error('Leonardo generation failed', error);

			return fail(502, { message: 'Something went wrong. Please try again.' });
		}
	}
};
