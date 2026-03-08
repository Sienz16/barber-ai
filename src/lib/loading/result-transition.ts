type AppStep = 'landing' | 'camera' | 'preview' | 'loading' | 'result';

type ResultTransitionInput = {
	currentStep: AppStep;
	incomingImageUrl: string | null | undefined;
	previousImageUrlAtSubmit: string | null;
};

export function shouldUseIncomingResult({
	currentStep,
	incomingImageUrl,
	previousImageUrlAtSubmit
}: ResultTransitionInput): boolean {
	if (currentStep !== 'loading') {
		return false;
	}

	if (!incomingImageUrl) {
		return false;
	}

	return incomingImageUrl !== previousImageUrlAtSubmit;
}
