import { env } from '$env/dynamic/private';

export type HaircutAnalyzerConfig = {
	apiKey: string;
	baseUrl: string;
	model: string;
};

export function getHaircutAnalyzerConfig(): HaircutAnalyzerConfig {
	if (!env.HAIRCUT_AI_API_KEY && !env.OPENAI_API_KEY) {
		throw new Error('Missing HAIRCUT_AI_API_KEY (or OPENAI_API_KEY) environment variable.');
	}

	if (!env.HAIRCUT_AI_BASE_URL) {
		throw new Error('Missing HAIRCUT_AI_BASE_URL environment variable.');
	}

	if (!env.HAIRCUT_AI_MODEL) {
		throw new Error('Missing HAIRCUT_AI_MODEL environment variable.');
	}

	return {
		apiKey: env.HAIRCUT_AI_API_KEY ?? env.OPENAI_API_KEY ?? '',
		baseUrl: env.HAIRCUT_AI_BASE_URL,
		model: env.HAIRCUT_AI_MODEL
	};
}
