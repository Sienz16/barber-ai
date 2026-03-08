import { describe, expect, it } from 'vitest';

import { shouldUseIncomingResult } from './result-transition';

describe('shouldUseIncomingResult', () => {
	it('ignores stale result while waiting for a fresh generation', () => {
		const shouldAccept = shouldUseIncomingResult({
			currentStep: 'loading',
			incomingImageUrl: 'https://cdn.example.com/old.jpg',
			previousImageUrlAtSubmit: 'https://cdn.example.com/old.jpg'
		});

		expect(shouldAccept).toBe(false);
	});

	it('accepts new result when incoming image url changes', () => {
		const shouldAccept = shouldUseIncomingResult({
			currentStep: 'loading',
			incomingImageUrl: 'https://cdn.example.com/new.jpg',
			previousImageUrlAtSubmit: 'https://cdn.example.com/old.jpg'
		});

		expect(shouldAccept).toBe(true);
	});

	it('ignores result updates outside loading step', () => {
		const shouldAccept = shouldUseIncomingResult({
			currentStep: 'result',
			incomingImageUrl: 'https://cdn.example.com/new.jpg',
			previousImageUrlAtSubmit: 'https://cdn.example.com/old.jpg'
		});

		expect(shouldAccept).toBe(false);
	});
});
