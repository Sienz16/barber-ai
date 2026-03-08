export type HaircutSuggestion = {
	id: string;
	panelLabel: '01' | '02' | '03' | '04';
	title: string;
	vibe: string;
	maintenance: string;
	reason: string;
	hairPrompt: string;
};

export type GenerationResult = {
	imageUrl: string;
	suggestions: HaircutSuggestion[];
};
