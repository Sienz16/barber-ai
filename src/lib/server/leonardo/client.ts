type FetchLike = typeof globalThis.fetch;

type UploadInitResponse = {
	uploadInitImage?: {
		id: string;
		url: string;
		fields?: Record<string, string> | string;
	};
	initImage?: {
		id: string;
		url: string;
		fields?: Record<string, string> | string;
	};
};

type GenerationCreateResponse = {
	sdGenerationJob?: { generationId: string };
	generate?: { generationId: string };
	generationId?: string;
	id?: string;
	jobId?: string;
};

type LeonardoErrorEntry = {
	message?: string;
	extensions?: {
		details?: {
			message?: string;
		};
	};
};

type GenerationStatusResponse = {
	generations_by_pk?: {
		status?: string;
		generated_images?: Array<{ url?: string } | null>;
	};
	generation_by_pk?: {
		status?: string;
		generated_images?: Array<{ url?: string } | null>;
	};
};

export type CreateLeonardoClientOptions = {
	apiKey: string;
	fetch: FetchLike;
};

type GenerateCollageOptions = {
	uploadedImageId: string;
	prompt: string;
	width: number;
	height: number;
};

export function createLeonardoClient({ apiKey, fetch }: CreateLeonardoClientOptions) {
	const headers = {
		accept: 'application/json',
		authorization: `Bearer ${apiKey}`
	};

	return {
		async uploadReferenceImage(file: File): Promise<string> {
			const initResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/init-image', {
				method: 'POST',
				headers: {
					...headers,
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					extension: file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
				})
			});

			if (!initResponse.ok) {
				const body = await initResponse.text().catch(() => '');
				throw new Error(`Failed to initialize Leonardo image upload. Status: ${initResponse.status}. ${body}`);
			}

			const initPayload = (await initResponse.json()) as UploadInitResponse;
			const upload = initPayload.uploadInitImage ?? initPayload.initImage;

			if (!upload?.id || !upload.url) {
				throw new Error('Leonardo upload response was missing upload details.');
			}

			const formData = new FormData();
			const parsedFields =
				typeof upload.fields === 'string'
					? (JSON.parse(upload.fields) as Record<string, string>)
					: (upload.fields ?? {});
			for (const [key, value] of Object.entries(parsedFields)) {
				formData.set(key, value);
			}
			formData.set('file', file);

			const uploadResponse = await fetch(upload.url, {
				method: 'POST',
				body: formData
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text().catch(() => '');
				throw new Error(`Failed to upload selfie to Leonardo. Status: ${uploadResponse.status}. ${errorText}`);
			}

			return upload.id;
		},

		async generateCollage({ uploadedImageId, prompt, width, height }: GenerateCollageOptions): Promise<string> {
			const requestBody = {
				model: 'seedream-4.5',
				public: false,
				parameters: {
					width,
					height,
					prompt,
					quantity: 1,
					style_ids: ['111dc692-d470-4eec-b791-3475abac4c46'],
					guidances: {
						image_reference: [
							{
								image: { id: uploadedImageId, type: 'UPLOADED' },
								strength: 'MID'
							}
						]
					}
				}
			};

			const response = await fetch('https://cloud.leonardo.ai/api/rest/v2/generations', {
				method: 'POST',
				headers: {
					...headers,
					'content-type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				const body = await response.text().catch(() => '');
				throw new Error(`Failed to create Leonardo generation. Status: ${response.status}. ${body}`);
			}

			const payload = (await response.json()) as GenerationCreateResponse | LeonardoErrorEntry[];
			console.log('Leonardo generation response:', JSON.stringify(payload));

			if (Array.isArray(payload) && payload.length > 0) {
				const errorMessage = payload[0]?.extensions?.details?.message ?? payload[0]?.message;
				if (errorMessage) {
					throw new Error(`Leonardo rejected generation request: ${errorMessage}`);
				}
			}

			const generationPayload = payload as GenerationCreateResponse;

			const generationId =
				generationPayload.generate?.generationId ??
				generationPayload.sdGenerationJob?.generationId ??
				generationPayload.generationId ??
				generationPayload.id ??
				generationPayload.jobId;

			if (!generationId) {
				throw new Error('Leonardo generation response was missing a generation ID.');
			}

			return generationId;
		},

		async waitForImage(generationId: string, maxAttempts = 40, delayMs = 3000): Promise<string> {
			for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
				const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
					headers
				});

				if (!response.ok) {
					throw new Error('Failed to fetch Leonardo generation result.');
				}

				const payload = (await response.json()) as GenerationStatusResponse;
				const generation = payload.generations_by_pk ?? payload.generation_by_pk;

				if (generation?.status === 'FAILED') {
					throw new Error('Leonardo generation failed.');
				}

				if (generation?.status === 'COMPLETE') {
					const imageUrl = generation.generated_images?.find((img) => img?.url)?.url;
					if (imageUrl) return imageUrl;
				}

				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}

			throw new Error('Leonardo generation timed out before an image was ready.');
		}
	};
}
