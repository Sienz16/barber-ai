import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import SuggestionCard from './suggestion-card.svelte';

describe('SuggestionCard', () => {
	it('renders haircut recommendation details', async () => {
		render(SuggestionCard, {
			props: {
				suggestion: {
					id: 'textured-crop',
					panelLabel: '01',
					title: 'Textured Crop',
					vibe: 'Sharp',
					maintenance: 'Low',
					reason: 'Adds structure.',
					hairPrompt: 'textured crop'
				}
			}
		});

		await expect.element(page.getByText('Textured Crop')).toBeInTheDocument();
		await expect.element(page.getByText(/maintenance/i)).toBeInTheDocument();
		await expect.element(page.getByText('01')).toBeInTheDocument();
	});
});
