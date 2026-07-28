// Resolves which step indices `inspect-presentation.mjs` should capture.
//
// The capture loop walks forward with ArrowRight and names each screenshot
// after its target index, so an unsorted, duplicated, or out-of-range `--steps`
// list would silently screenshot the wrong scene under a confident filename.
// Normalizing here keeps that loop honest.

/**
 * @param requested parsed `--steps` indices, or null for "every step"
 * @param stepCount the presentation's reported `data-step-count`
 */
export function resolveTargetSteps(requested, stepCount) {
  if (!Number.isInteger(stepCount) || stepCount < 1) {
    throw new Error(`presentation reported an unusable data-step-count: ${stepCount}`)
  }

  if (!requested) return Array.from({ length: stepCount }, (_, index) => index)

  if (requested.length === 0) {
    throw new Error('--steps listed no valid step indices')
  }

  const outOfRange = requested.filter((index) => index < 0 || index >= stepCount)
  if (outOfRange.length > 0) {
    throw new Error(
      `--steps out of range for a ${stepCount}-step presentation: ${outOfRange.join(', ')}`,
    )
  }

  return [...new Set(requested)].sort((a, b) => a - b)
}
