import reference from './reference.json' with { type: 'json' }
export const REFERENCE_SLUG = 'how-to-make-a-presentation'
export function validateSample(steps) {
  if (steps.length !== reference.length) throw new Error(`sample: expected nine steps, got ${steps.length}`)
  steps.forEach((step, i) => {
    const [era, title, caption] = reference[i]
    if (step.era !== era || step.title !== title || step.caption !== caption) throw new Error(`sample: outline mismatch at step ${i}`)
  })
}
export function validateCount(count) {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error(`render: invalid data-step-count ${count}`)
  return count
}
