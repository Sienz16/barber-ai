import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HaircutSuggestion } from '$lib/types/haircut';

const { buildHaircutSuggestionsMock } = vi.hoisted(() => ({
	buildHaircutSuggestionsMock: vi.fn()
}));

const uploadReferenceImage = vi.fn();
const generateCollage = vi.fn();
const waitForImage = vi.fn();

vi.mock('$lib/server/leonardo/client', () => ({
	createLeonardoClient: () => ({
		uploadReferenceImage,
		generateCollage,
		waitForImage
	})
}));

vi.mock('$lib/server/haircut/recommendation-engine', () => ({
	buildHaircutSuggestions: buildHaircutSuggestionsMock
}));

vi.mock('$lib/server/haircut/env', () => ({
	getHaircutAnalyzerConfig: () => ({
		apiKey: 'router-test-key',
		baseUrl: 'https://api.fxzly.my',
		model: 'gpt-5.4'
	})
}));

vi.mock('$lib/server/leonardo/env', () => ({
	getLeonardoApiKey: () => 'test-key'
}));

import { actions } from './+page.server';

describe('generate action', () => {
	const fakeSuggestions: HaircutSuggestion[] = [
		{
			id: 'crop-1',
			panelLabel: '01',
			title: 'Textured Crop',
			vibe: 'Sharp',
			maintenance: 'Low',
			reason: 'Works with cheek and jaw proportions.',
			hairPrompt: 'textured crop with low fade'
		},
		{
			id: 'taper-2',
			panelLabel: '02',
			title: 'Low Taper Quiff',
			vibe: 'Fresh',
			maintenance: 'Medium',
			reason: 'Adds vertical balance.',
			hairPrompt: 'low taper with short quiff'
		},
		{
			id: 'part-3',
			panelLabel: '03',
			title: 'Side Part Taper',
			vibe: 'Classic',
			maintenance: 'Low',
			reason: 'Adds proportion and asymmetry.',
			hairPrompt: 'classic side part with taper'
		},
		{
			id: 'pom-4',
			panelLabel: '04',
			title: 'Short Pompadour',
			vibe: 'Polished',
			maintenance: 'Medium',
			reason: 'Elongates silhouette cleanly.',
			hairPrompt: 'short pompadour with neat taper'
		}
	];

	beforeEach(() => {
		uploadReferenceImage.mockReset();
		generateCollage.mockReset();
		waitForImage.mockReset();
		buildHaircutSuggestionsMock.mockReset();
		buildHaircutSuggestionsMock.mockResolvedValue(fakeSuggestions);
	});

	it('rejects missing selfie upload', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			body: new FormData()
		});

		const result = await actions.generate({ request, fetch } as never);

		expect('status' in result && result.status).toBe(400);
	});

	it('rejects unsupported file types', async () => {
		const formData = new FormData();
		formData.set('selfie', new File(['x'], 'bad.gif', { type: 'image/gif' }));

		const result = await actions.generate({
			request: new Request('http://localhost', { method: 'POST', body: formData }),
			fetch
		} as never);

		expect('status' in result && result.status).toBe(400);
	});

	it('returns a collage image and four suggestions for a valid upload', async () => {
		uploadReferenceImage.mockResolvedValue('image-123');
		generateCollage.mockResolvedValue('gen-123');
		waitForImage.mockResolvedValue('https://cdn.example.com/collage.jpg');

		const formData = new FormData();
		formData.set('selfie', new File([new Uint8Array(1024)], 'selfie.jpg', { type: 'image/jpeg' }));

		const result = await actions.generate({
			request: new Request('http://localhost', { method: 'POST', body: formData }),
			fetch
		} as never);

		expect('result' in result).toBe(true);
		if (!('result' in result)) {
			throw new Error('Expected successful generation result.');
		}

		expect(result).toMatchObject({
			success: true,
			result: {
				imageUrl: 'https://cdn.example.com/collage.jpg'
			}
		});
		expect(result.result.suggestions).toHaveLength(4);
		expect(buildHaircutSuggestionsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: 'router-test-key',
				baseUrl: 'https://api.fxzly.my',
				model: 'gpt-5.4'
			})
		);
		expect(generateCollage).toHaveBeenCalledWith(
			expect.objectContaining({
				width: 768,
				height: 1152
			})
		);
	});
});
