export type GenerationStage = {
	title: string;
	description: string;
	stepLabel: string;
};

const STAGE_ONE_DURATION_MS = 4500;

export function getGenerationStage(elapsedMs: number): GenerationStage {
	if (elapsedMs < STAGE_ONE_DURATION_MS) {
		return {
			stepLabel: 'Step 1 of 2',
			title: 'Analyzing your face with AI router',
			description:
				'Measuring face structure, hair density, and proportion to choose styles that fit instead of trend picks.'
		};
	}

	return {
		stepLabel: 'Step 2 of 2',
		title: 'Rendering with Leonardo',
		description: 'Generating your final 2x2 collage with consistent angle, lighting, and hairstyle-only changes.'
	};
}
