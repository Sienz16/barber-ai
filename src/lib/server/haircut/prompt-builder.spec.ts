import { describe, expect, it } from 'vitest';

import type { HaircutSuggestion } from '$lib/types/haircut';

import { buildSeedreamCollagePrompt } from './prompt-builder';

const suggestions: HaircutSuggestion[] = [
	{ id: 'a', panelLabel: '01', title: 'A', vibe: 'Clean', maintenance: 'Low', reason: 'x', hairPrompt: 'cut one' },
	{ id: 'b', panelLabel: '02', title: 'B', vibe: 'Fresh', maintenance: 'Low', reason: 'x', hairPrompt: 'cut two' },
	{ id: 'c', panelLabel: '03', title: 'C', vibe: 'Soft', maintenance: 'Medium', reason: 'x', hairPrompt: 'cut three' },
	{ id: 'd', panelLabel: '04', title: 'D', vibe: 'Bold', maintenance: 'Medium', reason: 'x', hairPrompt: 'cut four' }
];

describe('buildSeedreamCollagePrompt', () => {
	it('enforces identity preservation and 2x2 collage layout', () => {
		const prompt = buildSeedreamCollagePrompt(suggestions);

		expect(prompt).toContain('2x2 haircut collage');
		expect(prompt).toContain('IDENTITY LOCK');
		expect(prompt).toContain('Do not beautify');
		expect(prompt).toContain('same person, same outfit, same face');
		expect(prompt).toContain('Panel 01');
		expect(prompt).toContain('Panel 04');
		expect(prompt).toContain('analyze the face carefully');
		expect(prompt).toContain('Do not pick trendy cuts unless they are the best fit');
		expect(prompt).toContain('Keep full head and upper shoulders visible; no tight crop');
		expect(prompt).toContain('Frame and center the full face in each panel');
		expect(prompt).toContain('Do not crop, cut off, or hide facial features');
		expect(prompt).toContain('Each panel must be a clearly distinct hairstyle');
		expect(prompt).toContain('Do not repeat or make near-duplicate cuts across panels');
		expect(prompt).toContain('Avoid extreme or ultra-short cuts unless explicitly requested');
		expect(prompt).toContain('Avoid dated or old-fashioned styles');
	});

	it('includes each suggestion hair prompt in the output', () => {
		const prompt = buildSeedreamCollagePrompt(suggestions);

		for (const suggestion of suggestions) {
			expect(prompt).toContain(suggestion.hairPrompt);
		}
	});

	it('preserves outfit and clothing instructions', () => {
		const prompt = buildSeedreamCollagePrompt(suggestions);

		expect(prompt).toContain('identical clothing');
		expect(prompt).toContain('Do not change, swap, or remove any clothing item');
	});

	it('keeps production prompt within Leonardo max length', () => {
		const productionLikeSuggestions: HaircutSuggestion[] = [
			{
				id: 'crop-1',
				panelLabel: '01',
				title: 'Textured Crop',
				vibe: 'Sharp',
				maintenance: 'Low',
				reason: 'Balances width with controlled height.',
				hairPrompt: 'textured crop haircut, short faded sides, matte natural finish'
			},
			{
				id: 'taper-2',
				panelLabel: '02',
				title: 'Low Taper Quiff',
				vibe: 'Fresh',
				maintenance: 'Medium',
				reason: 'Adds vertical proportion and lift.',
				hairPrompt: 'low taper with short quiff, controlled volume and texture'
			},
			{
				id: 'part-3',
				panelLabel: '03',
				title: 'Side Part Taper',
				vibe: 'Classic',
				maintenance: 'Low',
				reason: 'Creates clean asymmetry for balance.',
				hairPrompt: 'side part taper with natural comb texture and tidy edges'
			},
			{
				id: 'pom-4',
				panelLabel: '04',
				title: 'Short Pompadour',
				vibe: 'Polished',
				maintenance: 'Medium',
				reason: 'Lengthens silhouette while keeping sides clean.',
				hairPrompt: 'short pompadour with neat taper and soft natural hold'
			}
		];

		const prompt = buildSeedreamCollagePrompt(productionLikeSuggestions);

		expect(prompt.length).toBeLessThanOrEqual(1500);
	});

	it('keeps prompt under Leonardo limit even when AI returns verbose hairstyle text', () => {
		const long = 'very long hairstyle description with many details '.repeat(30);
		const verboseSuggestions: HaircutSuggestion[] = [
			{ id: '1', panelLabel: '01', title: 'A', vibe: 'x', maintenance: 'x', reason: 'x', hairPrompt: long },
			{ id: '2', panelLabel: '02', title: 'B', vibe: 'x', maintenance: 'x', reason: 'x', hairPrompt: long },
			{ id: '3', panelLabel: '03', title: 'C', vibe: 'x', maintenance: 'x', reason: 'x', hairPrompt: long },
			{ id: '4', panelLabel: '04', title: 'D', vibe: 'x', maintenance: 'x', reason: 'x', hairPrompt: long }
		];

		const prompt = buildSeedreamCollagePrompt(verboseSuggestions);

		expect(prompt.length).toBeLessThanOrEqual(1500);
		expect(prompt).toContain('Panel 01');
		expect(prompt).toContain('Panel 04');
	});
});
