import { beforeEach, describe, expect, it, vi } from 'vitest';

const { privateEnv } = vi.hoisted(() => ({
	privateEnv: {} as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({
	env: privateEnv
}));

import { getHaircutAnalyzerConfig } from './env';

describe('getHaircutAnalyzerConfig', () => {
	beforeEach(() => {
		for (const key of Object.keys(privateEnv)) {
			delete privateEnv[key];
		}
	});

	it('throws when the haircut api base url is missing', () => {
		privateEnv.HAIRCUT_AI_API_KEY = 'test-key';
		privateEnv.HAIRCUT_AI_MODEL = 'gpt-5.4';

		expect(() => getHaircutAnalyzerConfig()).toThrow(
			'Missing HAIRCUT_AI_BASE_URL environment variable.'
		);
	});

	it('throws when the haircut model is missing', () => {
		privateEnv.HAIRCUT_AI_API_KEY = 'test-key';
		privateEnv.HAIRCUT_AI_BASE_URL = 'https://api.example.com';

		expect(() => getHaircutAnalyzerConfig()).toThrow(
			'Missing HAIRCUT_AI_MODEL environment variable.'
		);
	});

	it('returns the configured api key, base url, and model', () => {
		privateEnv.HAIRCUT_AI_API_KEY = 'test-key';
		privateEnv.HAIRCUT_AI_BASE_URL = 'https://api.example.com';
		privateEnv.HAIRCUT_AI_MODEL = 'gpt-5.4';

		expect(getHaircutAnalyzerConfig()).toEqual({
			apiKey: 'test-key',
			baseUrl: 'https://api.example.com',
			model: 'gpt-5.4'
		});
	});
});
