import { describe, it, expect } from 'vitest'
import { clamp } from '../src/presentation-kit/usePresentationNav'
import { fitScale } from '../src/presentation-kit/useFitScale'
describe('scene geometry and navigation', () => {
 it('clamps at both ends', () => { expect(clamp(-1, 9)).toBe(0); expect(clamp(9, 9)).toBe(8) })
 it('fits the canvas uniformly using mode geometry', () => { expect(fitScale(920, 610, 'browse')).toBe(1); expect(fitScale(480, 610, 'browse')).toBe(.5); expect(fitScale(920, 510, 'present')).toBe(1) })
})
