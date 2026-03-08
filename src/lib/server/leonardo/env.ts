import { env } from '$env/dynamic/private';

export function getLeonardoApiKey(): string {
	if (!env.LEONARDO_API_KEY) {
		throw new Error('Missing LEONARDO_API_KEY environment variable.');
	}

	return env.LEONARDO_API_KEY;
}
