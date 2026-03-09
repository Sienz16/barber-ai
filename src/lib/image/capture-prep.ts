type DownscaleInput = {
	width: number;
	height: number;
	maxDimension: number;
};

type Size = {
	width: number;
	height: number;
};

export function getDownscaledDimensions({ width, height, maxDimension }: DownscaleInput): Size {
	if (width <= 0 || height <= 0 || maxDimension <= 0) {
		return { width: maxDimension, height: maxDimension };
	}

	const maxSourceDimension = Math.max(width, height);
	if (maxSourceDimension <= maxDimension) {
		return { width, height };
	}

	const scale = maxDimension / maxSourceDimension;
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
}

export function getMobileCaptureJpegQuality({ width, height }: Size): number {
	const pixelCount = width * height;
	if (pixelCount >= 8_000_000) {
		return 0.82;
	}

	return 0.88;
}
