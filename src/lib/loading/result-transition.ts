type AppStep = 'landing' | 'camera' | 'preview' | 'loading' | 'result';

type ResultTransitionInput = {
	currentStep: AppStep;
	incomingImageUrl: string | null | undefined;
	previousImageUrlAtSubmit: string | null;
};

type SubmitActionResultType = 'success' | 'failure' | 'error' | 'redirect';

type SubmitTransitionInput = {
	currentStep: AppStep;
	actionResultType: SubmitActionResultType;
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

export function getStepAfterSubmitResult({
	currentStep,
	actionResultType
}: SubmitTransitionInput): AppStep {
	if (currentStep !== 'loading') {
		return currentStep;
	}

	if (actionResultType === 'failure' || actionResultType === 'error') {
		return 'preview';
	}

	return currentStep;
}
