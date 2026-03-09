import { describe, expect, it } from 'vitest';

import { getDownscaledDimensions, getMobileCaptureJpegQuality } from './capture-prep';

describe('getDownscaledDimensions', () => {
	it('keeps dimensions when already below limit', () => {
		expect(getDownscaledDimensions({ width: 640, height: 480, maxDimension: 1280 })).toEqual({
			width: 640,
			height: 480
		});
	});

	it('downscales portrait image while preserving aspect ratio', () => {
		expect(getDownscaledDimensions({ width: 3024, height: 4032, maxDimension: 1280 })).toEqual({
			width: 960,
			height: 1280
		});
	});

	it('downscales landscape image while preserving aspect ratio', () => {
		expect(getDownscaledDimensions({ width: 4032, height: 3024, maxDimension: 1280 })).toEqual({
			width: 1280,
			height: 960
		});
	});

	it('returns safe fallback for invalid source dimensions', () => {
		expect(getDownscaledDimensions({ width: 0, height: 0, maxDimension: 1280 })).toEqual({
			width: 1280,
			height: 1280
		});
	});
});

describe('getMobileCaptureJpegQuality', () => {
	it('uses stronger compression for high megapixel captures', () => {
		expect(getMobileCaptureJpegQuality({ width: 4032, height: 3024 })).toBe(0.82);
	});

	it('uses balanced compression for standard captures', () => {
		expect(getMobileCaptureJpegQuality({ width: 1280, height: 960 })).toBe(0.88);
	});
});
