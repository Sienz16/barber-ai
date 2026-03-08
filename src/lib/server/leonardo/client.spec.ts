import { describe, expect, it, vi } from 'vitest';

import { createLeonardoClient } from './client';

describe('createLeonardoClient', () => {
	it('posts a private Seedream 4.5 generation request with image reference guidance', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sdGenerationJob: { generationId: 'gen-123' } })));
		const client = createLeonardoClient({ apiKey: 'test-key', fetch: fetchMock as typeof fetch });

		await client.generateCollage({
			uploadedImageId: 'image-123',
			prompt: 'strict prompt',
			width: 1024,
			height: 1024
		});

		expect(fetchMock).toHaveBeenCalled();
		const lastCall = fetchMock.mock.calls.at(-1);
		expect(lastCall).toBeDefined();
		const [, init] = lastCall as unknown as [string, RequestInit];
		const body = JSON.parse(String(init.body));

		expect(body.model).toBe('seedream-4.5');
		expect(body.public).toBe(false);
		expect(body.parameters.guidances.image_reference[0].image.id).toBe('image-123');
	});

	it('throws a validation error when Leonardo returns GraphQL-style errors without generationId', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(
					JSON.stringify([
						{
							extensions: {
								code: 'BadRequestException',
								details: {
									message: 'Validation failed. Please check your request parameters.'
								}
							},
							message: 'An error occurred.',
							path: ['generate']
						}
					])
				)
		);

		const client = createLeonardoClient({ apiKey: 'test-key', fetch: fetchMock as typeof fetch });

		await expect(
			client.generateCollage({
				uploadedImageId: 'image-123',
				prompt: 'strict prompt',
				width: 768,
				height: 1152
			})
		).rejects.toThrow('Validation failed. Please check your request parameters.');
	});
});
