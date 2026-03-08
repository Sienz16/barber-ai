import { describe, expect, it } from 'vitest';

import { getGenerationStage } from './generation-stages';

describe('getGenerationStage', () => {
	it('starts with router analysis phase and moves to Leonardo phase', () => {
		expect(getGenerationStage(0).title).toContain('Analyzing your face');
		expect(getGenerationStage(4500).title).toContain('Rendering with Leonardo');
	});
});
