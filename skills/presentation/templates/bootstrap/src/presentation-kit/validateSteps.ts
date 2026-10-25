import type { StepMeta } from './types'
export function validateSteps(steps: readonly StepMeta[]) {
  if (!steps.length) throw new Error('Presentation requires at least one step')
  if (new Set(steps.map(s => s.id)).size !== steps.length) throw new Error('Step identities must be unique')
}
