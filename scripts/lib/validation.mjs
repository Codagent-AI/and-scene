import reference from './reference.json' with { type: 'json' }
export class SampleValidationError extends Error {
  constructor(message) { super(message); this.name = 'SampleValidationError' }
}
export function failurePhase(error, fallback) {
  for (let cause = error; cause; cause = cause.cause) if (cause instanceof SampleValidationError) return 'sample'
  return fallback
}
export const REFERENCE_SLUG = 'how-to-make-a-presentation'
export function validateSampleStep(step, index) {
  const [era, title, caption] = reference[index] ?? []
  if (step.era !== era || step.title !== title || step.caption !== caption) throw new SampleValidationError(`sample: outline mismatch at step ${index}`)
}
export function validateSample(steps) {
  if (steps.length !== reference.length) throw new SampleValidationError(`sample: expected nine steps, got ${steps.length}`)
  steps.forEach(validateSampleStep)
}
export function validateCount(count) {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error(`render: invalid data-step-count ${count}`)
  return count
}
