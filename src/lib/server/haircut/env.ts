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

	return {
		apiKey: env.HAIRCUT_AI_API_KEY ?? env.OPENAI_API_KEY ?? '',
		baseUrl: env.HAIRCUT_AI_BASE_URL ?? 'https://api.fxzly.my',
		model: env.HAIRCUT_AI_MODEL ?? 'gpt-5.4'
	};
}
