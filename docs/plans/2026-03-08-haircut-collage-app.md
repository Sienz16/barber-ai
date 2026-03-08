# Haircut Collage App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first SvelteKit app that accepts one selfie and returns one realistic 2x2 collage showing four haircut suggestions while preserving the user's face exactly.

**Architecture:** Use a single-route SvelteKit flow with a server action for upload and generation, server-only Leonardo API helpers in `$lib/server`, and a mobile-native UI in `src/routes/+page.svelte`. Keep Leonardo credentials in `$env/static/private`, upload the selfie as a reference image, build one strict Seedream 4.5 collage prompt, and return the collage URL plus four local suggestion descriptions derived from a deterministic recommendation engine.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind CSS 4, Vitest browser tests, Leonardo AI REST API

---

### Task 1: Establish the Leonardo integration contract

**Files:**
- Create: `src/lib/types/haircut.ts`
- Create: `src/lib/server/haircut/recommendation-engine.ts`
- Test: `src/lib/server/haircut/recommendation-engine.spec.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { buildHaircutSuggestions } from './recommendation-engine';

describe('buildHaircutSuggestions', () => {
	it('returns four distinct collage suggestions for a selfie-only flow', () => {
		const suggestions = buildHaircutSuggestions();

		expect(suggestions).toHaveLength(4);
		expect(new Set(suggestions.map((item) => item.id)).size).toBe(4);
		expect(suggestions.every((item) => item.title.length > 0)).toBe(true);
		expect(suggestions.every((item) => item.panelLabel.match(/^0[1-4]$/))).toBe(true);
	});
});
```

**Step 2: Run test to verify it fails**

Run: `bun vitest run src/lib/server/haircut/recommendation-engine.spec.ts`
Expected: FAIL with module or export not found.

**Step 3: Write minimal implementation**

```typescript
export type HaircutSuggestion = {
	id: string;
	panelLabel: '01' | '02' | '03' | '04';
	title: string;
	vibe: string;
	maintenance: string;
	reason: string;
	hairPrompt: string;
};

export function buildHaircutSuggestions(): HaircutSuggestion[] {
	return [
		{
			id: 'textured-crop',
			panelLabel: '01',
			title: 'Textured Crop',
			vibe: 'Sharp',
			maintenance: 'Low',
			reason: 'Adds structure and keeps the forehead balanced.',
			hairPrompt: 'textured crop haircut'
		},
		// three more distinct suggestion objects
	];
	}
```

**Step 4: Run test to verify it passes**

Run: `bun vitest run src/lib/server/haircut/recommendation-engine.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/types/haircut.ts src/lib/server/haircut/recommendation-engine.ts src/lib/server/haircut/recommendation-engine.spec.ts
git commit -m "feat: add haircut suggestion engine"
```

### Task 2: Build the strict Seedream collage prompt

**Files:**
- Create: `src/lib/server/haircut/prompt-builder.ts`
- Test: `src/lib/server/haircut/prompt-builder.spec.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { buildSeedreamCollagePrompt } from './prompt-builder';
import type { HaircutSuggestion } from '$lib/types/haircut';

const suggestions: HaircutSuggestion[] = [
	{ id: 'a', panelLabel: '01', title: 'A', vibe: 'Clean', maintenance: 'Low', reason: 'x', hairPrompt: 'cut one' },
	{ id: 'b', panelLabel: '02', title: 'B', vibe: 'Fresh', maintenance: 'Low', reason: 'x', hairPrompt: 'cut two' },
	{ id: 'c', panelLabel: '03', title: 'C', vibe: 'Soft', maintenance: 'Medium', reason: 'x', hairPrompt: 'cut three' },
	{ id: 'd', panelLabel: '04', title: 'D', vibe: 'Bold', maintenance: 'Medium', reason: 'x', hairPrompt: 'cut four' }
];

describe('buildSeedreamCollagePrompt', () => {
	it('enforces identity preservation and 2x2 collage layout', () => {
		const prompt = buildSeedreamCollagePrompt(suggestions);

		expect(prompt).toContain('2x2 collage');
		expect(prompt).toContain('same exact person in all four panels');
		expect(prompt).toContain('do not beautify');
		expect(prompt).toContain('Panel 01');
		expect(prompt).toContain('Panel 04');
	});
});
```

**Step 2: Run test to verify it fails**

Run: `bun vitest run src/lib/server/haircut/prompt-builder.spec.ts`
Expected: FAIL with module or export not found.

**Step 3: Write minimal implementation**

```typescript
import type { HaircutSuggestion } from '$lib/types/haircut';

export function buildSeedreamCollagePrompt(suggestions: HaircutSuggestion[]): string {
	return [
		'Create one clean realistic 2x2 collage.',
		'Same exact person in all four panels.',
		'Preserve original face shape, skin tone, skin texture, hairline, facial proportions, expression and identity.',
		'Do not beautify, retouch, smooth skin, change ethnicity, alter facial features or modify age impression.',
		...suggestions.map((suggestion) => `Panel ${suggestion.panelLabel}: ${suggestion.hairPrompt}.`)
	].join(' ');
	}
```

**Step 4: Run test to verify it passes**

Run: `bun vitest run src/lib/server/haircut/prompt-builder.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/haircut/prompt-builder.ts src/lib/server/haircut/prompt-builder.spec.ts
git commit -m "feat: add Seedream collage prompt builder"
```

### Task 3: Implement Leonardo upload and generation client

**Files:**
- Create: `src/lib/server/leonardo/client.ts`
- Create: `src/lib/server/leonardo/env.ts`
- Test: `src/lib/server/leonardo/client.spec.ts`
- Check: `src/app.d.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { createLeonardoClient } from './client';

describe('createLeonardoClient', () => {
	it('posts a private Seedream 4.5 generation request with image reference guidance', async () => {
		const fetchMock = vi.fn();
		const client = createLeonardoClient({ apiKey: 'test-key', fetch: fetchMock as typeof fetch });

		await client.generateCollage({
			uploadedImageId: 'image-123',
			prompt: 'strict prompt',
			width: 1024,
			height: 1024
		});

		expect(fetchMock).toHaveBeenCalled();
		const [, init] = fetchMock.mock.calls.at(-1);
		const body = JSON.parse(String(init?.body));
		expect(body.model).toBe('seedream-4.5');
		expect(body.public).toBe(false);
		expect(body.parameters.guidances.image_reference[0].image.id).toBe('image-123');
	});
	});
```

**Step 2: Run test to verify it fails**

Run: `bun vitest run src/lib/server/leonardo/client.spec.ts`
Expected: FAIL with module or export not found.

**Step 3: Write minimal implementation**

```typescript
export function createLeonardoClient(deps: { apiKey: string; fetch: typeof globalThis.fetch }) {
	return {
		async generateCollage({ uploadedImageId, prompt, width, height }) {
			return deps.fetch('https://cloud.leonardo.ai/api/rest/v2/generations', {
				method: 'POST',
				headers: {
					accept: 'application/json',
					authorization: `Bearer ${deps.apiKey}`,
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					model: 'seedream-4.5',
					public: false,
					parameters: {
						width,
						height,
						prompt,
						quantity: 1,
						style_ids: ['ab5a4220-7c42-41e5-a578-eddb9fed3d75'],
						guidances: {
							image_reference: [{ image: { id: uploadedImageId, type: 'UPLOADED' }, strength: 'HIGH' }]
						}
					}
				})
			});
		}
	};
}
```

**Step 4: Run test to verify it passes**

Run: `bun vitest run src/lib/server/leonardo/client.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/server/leonardo/env.ts src/lib/server/leonardo/client.ts src/lib/server/leonardo/client.spec.ts src/app.d.ts
git commit -m "feat: add Leonardo generation client"
```

### Task 4: Add a server action for selfie upload and result shaping

**Files:**
- Create: `src/routes/+page.server.ts`
- Test: `src/routes/page.server.spec.ts`
- Modify: `src/lib/server/leonardo/client.ts`
- Modify: `src/lib/server/haircut/prompt-builder.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { actions } from './+page.server';

describe('generate action', () => {
	it('rejects missing selfie upload', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			body: new FormData()
		});

		const result = await actions.generate({ request } as never);

		expect(result.status).toBe(400);
	});
	});
```

**Step 2: Run test to verify it fails**

Run: `bun vitest run src/routes/page.server.spec.ts`
Expected: FAIL with missing action implementation.

**Step 3: Write minimal implementation**

```typescript
import { fail } from '@sveltejs/kit';

export const actions = {
	generate: async ({ request }) => {
		const data = await request.formData();
		const selfie = data.get('selfie');

		if (!(selfie instanceof File) || selfie.size === 0) {
			return fail(400, { message: 'Please upload one clear selfie.' });
		}

		return {
			success: true,
			result: {
				imageUrl: 'https://example.com/collage.jpg',
				suggestions: []
			}
		};
	}
} satisfies import('./$types').Actions;
```

**Step 4: Run test to verify it passes**

Run: `bun vitest run src/routes/page.server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/routes/+page.server.ts src/routes/page.server.spec.ts src/lib/server/leonardo/client.ts src/lib/server/haircut/prompt-builder.ts
git commit -m "feat: add selfie generation action"
```

### Task 5: Replace the starter page with the mobile-first app shell

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/layout.css`
- Modify: `src/routes/page.svelte.spec.ts`
- Check: `src/routes/+layout.svelte`

**Step 1: Write the failing test**

```typescript
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AppPage from './+page.svelte';

describe('/+page.svelte', () => {
	it('renders a mobile-first selfie upload experience', async () => {
		render(AppPage, {
			props: {
				data: {},
				form: undefined
			}
		});

		await expect.element(page.getByRole('heading', { name: /haircut that fits your face/i })).toBeInTheDocument();
		await expect.element(page.getByLabelText(/upload selfie/i)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /generate collage/i })).toBeInTheDocument();
	});
	});
```

**Step 2: Run test to verify it fails**

Run: `bun vitest run src/routes/page.svelte.spec.ts`
Expected: FAIL because the starter page does not contain the new UI.

**Step 3: Write minimal implementation**

```svelte
<svelte:head>
	<title>Barber AI | Haircut collage preview</title>
	<meta name="description" content="Upload one selfie and get four realistic haircut suggestions in one collage." />
</svelte:head>

<script lang="ts">
	let { form } = $props();
	let isSubmitting = $state(false);
</script>

<form method="POST" action="?/generate" enctype="multipart/form-data">
	<label>
		Upload selfie
		<input name="selfie" type="file" accept="image/png,image/jpeg,image/webp" />
	</label>
	<button type="submit">Generate collage</button>
</form>
```

**Step 4: Run test to verify it passes**

Run: `bun vitest run src/routes/page.svelte.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/routes/+page.svelte src/routes/layout.css src/routes/page.svelte.spec.ts
git commit -m "feat: add mobile-first collage interface"
```

### Task 6: Render result states and app-like behavior

**Files:**
- Modify: `src/routes/+page.svelte`
- Create: `src/lib/components/result-collage.svelte`
- Create: `src/lib/components/suggestion-card.svelte`
- Test: `src/lib/components/result-collage.spec.ts`
- Test: `src/lib/components/suggestion-card.spec.ts`

**Step 1: Write the failing test**

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `bun vitest run src/lib/components/result-collage.spec.ts src/lib/components/suggestion-card.spec.ts`
Expected: FAIL with missing component files.

**Step 3: Write minimal implementation**

```svelte
<!-- result-collage.svelte -->
<script lang="ts">
	let { imageUrl } = $props();
</script>

<div>
	<img src={imageUrl} alt="Generated haircut collage" />
	<span>01</span>
	<span>02</span>
	<span>03</span>
	<span>04</span>
</div>
```

**Step 4: Run test to verify it passes**

Run: `bun vitest run src/lib/components/result-collage.spec.ts src/lib/components/suggestion-card.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/routes/+page.svelte src/lib/components/result-collage.svelte src/lib/components/suggestion-card.svelte src/lib/components/result-collage.spec.ts src/lib/components/suggestion-card.spec.ts
git commit -m "feat: add collage result presentation"
```

### Task 7: Harden validation and Leonardo error handling

**Files:**
- Modify: `src/routes/+page.server.ts`
- Test: `src/routes/page.server.spec.ts`
- Modify: `src/lib/server/leonardo/client.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { actions } from './+page.server';

describe('generate action validation', () => {
	it('rejects unsupported file types', async () => {
		const formData = new FormData();
		formData.set('selfie', new File(['x'], 'bad.gif', { type: 'image/gif' }));

		const result = await actions.generate({
			request: new Request('http://localhost', { method: 'POST', body: formData })
		} as never);

		expect(result.status).toBe(400);
	});
	});
```

**Step 2: Run test to verify it fails**

Run: `bun vitest run src/routes/page.server.spec.ts`
Expected: FAIL because file validation is incomplete.

**Step 3: Write minimal implementation**

```typescript
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

if (!allowedTypes.has(selfie.type)) {
	return fail(400, { message: 'Use JPG, PNG, or WebP.' });
}

if (selfie.size > 10 * 1024 * 1024) {
	return fail(400, { message: 'Use an image under 10MB.' });
}
```

**Step 4: Run test to verify it passes**

Run: `bun vitest run src/routes/page.server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/routes/+page.server.ts src/routes/page.server.spec.ts src/lib/server/leonardo/client.ts
git commit -m "fix: validate selfie uploads and generation errors"
```

### Task 8: Final verification and docs

**Files:**
- Modify: `README.md`
- Check: `.env.example`
- Check: `package.json`

**Step 1: Write the failing test**

```text
No new automated test file. This task verifies the integrated feature set and documents required environment variables.
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: Any failures here must be fixed before moving on.

**Step 3: Write minimal implementation**

```md
Add setup instructions for `LEONARDO_API_KEY`, local development, and the collage generation flow.
```

**Step 4: Run test to verify it passes**

Run: `bun test && bun run check && bun run build`
Expected: PASS for tests, type checks, and production build.

**Step 5: Commit**

```bash
git add README.md .env.example package.json
git commit -m "docs: add setup for haircut collage app"
```
