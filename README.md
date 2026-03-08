# Barber AI

Mobile-first SvelteKit app for generating a single realistic 2x2 haircut collage from one selfie. The flow is optimized for cost: one upload, one Leonardo Seedream 4.5 generation, four haircut directions inside one image.

## What it does

- accepts one selfie upload
- sends the selfie to Leonardo as the reference image
- generates one clean 2x2 collage with four hairstyle variations
- keeps the face identity anchored with a strict prompt strategy
- shows four matching recommendation cards with vibe, maintenance, and fit notes

## Stack

- SvelteKit 2
- Svelte 5
- TypeScript
- Tailwind CSS 4
- Vitest browser + server tests
- Leonardo AI Seedream 4.5

## Environment

Copy `.env.example` to `.env` and add your Leonardo key:

```sh
cp .env.example .env
```

Required variables:

```env
LEONARDO_API_KEY=your_leonardo_api_key_here
```

## Local development

```sh
bun install
bun run dev
```

## Scripts

```sh
bun run test
bun run check
bun run build
```

## Leonardo flow

The app currently uses this sequence:

1. validate the uploaded selfie on the server
2. request an init image upload from Leonardo
3. upload the selfie as the image reference
4. create one private `seedream-4.5` generation
5. poll Leonardo until the collage image URL is ready
6. render the collage and four local recommendation cards

## Prompt strategy

The generation prompt is tuned to force:

- one clean realistic 2x2 collage
- same exact person in all four panels
- no beautify, no retouch, no skin smoothing
- same face shape, skin tone, proportions, expression, and identity
- only the hair changes between the four panels

## Notes

- the Leonardo API key stays server-side only
- result cards are generated locally for readability and consistency
- the UI is designed mobile-first to feel close to an app experience
