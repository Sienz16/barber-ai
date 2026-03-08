import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('renders a mobile-first selfie upload experience', async () => {
		render(Page, {
			props: {
				data: {},
				form: undefined
			}
		});

		await expect
			.element(page.getByRole('heading', { level: 1, name: /haircut that fits your face/i }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /open selfie camera/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /generate collage/i })).toBeInTheDocument();
	});
});
