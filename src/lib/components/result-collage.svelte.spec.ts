import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import ResultCollage from './result-collage.svelte';

describe('ResultCollage', () => {
	it('renders the generated collage image and quadrant labels', async () => {
		render(ResultCollage, {
			props: {
				imageUrl: 'https://example.com/collage.jpg'
			}
		});

		await expect.element(page.getByRole('img', { name: /generated haircut collage/i })).toBeInTheDocument();
		await expect.element(page.getByText('01')).toBeInTheDocument();
		await expect.element(page.getByText('04')).toBeInTheDocument();
	});
});
