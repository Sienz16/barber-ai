import { describe, expect, it, vi } from 'vitest';

import { buildHaircutSuggestions } from './recommendation-engine';

describe('buildHaircutSuggestions', () => {
	it('returns four AI-selected suggestions from selfie analysis', async () => {
		const selfie = new File([new Uint8Array([1, 2, 3])], 'selfie.jpg', { type: 'image/jpeg' });
		const fetchMock = vi.fn(async () =>
			new Response(
				JSON.stringify({
					choices: [
						{
							message: {
								content: JSON.stringify({
									suggestions: [
										{
											title: 'Textured Crop',
											vibe: 'Sharp',
											maintenance: 'Low',
											reason: 'Balances roundness by adding top structure.',
											hairPrompt: 'textured crop with clean low fade, matte finish'
										},
										{
											title: 'Low Taper Quiff',
											vibe: 'Fresh',
											maintenance: 'Medium',
											reason: 'Creates vertical lift and slims cheek area visually.',
											hairPrompt: 'low taper with short quiff and natural texture'
										},
										{
											title: 'Side Part Taper',
											vibe: 'Classic',
											maintenance: 'Low',
											reason: 'Adds asymmetry for better facial proportion.',
											hairPrompt: 'classic side part with low taper and soft texture'
										},
										{
											title: 'Short Pompadour',
											vibe: 'Polished',
											maintenance: 'Medium',
											reason: 'Keeps sides tight while elongating upper silhouette.',
											hairPrompt: 'short pompadour with neat taper, natural volume'
										}
									]
								})
							}
						}
					]
				})
			)
		);

		const suggestions = await buildHaircutSuggestions({
			selfie,
			apiKey: 'test-key',
			baseUrl: 'https://api.fxzly.my',
			model: 'gpt-5.4',
			fetch: fetchMock as typeof fetch
		} as never);

		expect(suggestions).toHaveLength(4);
		expect(new Set(suggestions.map((item) => item.id)).size).toBe(4);
		expect(suggestions.every((item) => item.title.length > 0)).toBe(true);
		expect(suggestions.every((item) => /^0[1-4]$/.test(item.panelLabel))).toBe(true);

		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://api.fxzly.my/v1/chat/completions');
		const body = JSON.parse(String(init.body));
		expect(body.model).toBe('gpt-5.4');
		expect(body.messages[1].content[1].type).toBe('image_url');
		expect(String(body.messages[1].content[1].image_url.url)).toContain('data:image/jpeg;base64,');
	});

	it('throws when AI returns fewer than four suggestions', async () => {
		const selfie = new File([new Uint8Array([1, 2, 3])], 'selfie.jpg', { type: 'image/jpeg' });
		const fetchMock = vi.fn(async () =>
			new Response(
				JSON.stringify({
					choices: [
						{
							message: {
								content: JSON.stringify({
									suggestions: [
										{
											title: 'Only One',
											vibe: 'x',
											maintenance: 'x',
											reason: 'x',
											hairPrompt: 'x'
										}
									]
								})
							}
						}
					]
				})
			)
		);

		await expect(
			buildHaircutSuggestions({
				selfie,
				apiKey: 'test-key',
				baseUrl: 'https://api.fxzly.my',
				model: 'gpt-5.4',
				fetch: fetchMock as typeof fetch
			} as never)
		).rejects.toThrow('AI haircut analysis must return exactly four suggestions.');
	});
});
