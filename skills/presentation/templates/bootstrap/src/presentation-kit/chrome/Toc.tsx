import type { Step } from '../types'

export function Toc<TPayload>({ steps, index, onGoTo }: { steps: Step<TPayload>[]; index: number; onGoTo: (index: number) => void }) {
  const firstByEra = new Map<string, number>()
  steps.forEach((step, stepIndex) => { if (!firstByEra.has(step.era)) firstByEra.set(step.era, stepIndex) })
  return <nav data-presentation-toc aria-label="Table of contents" style={{ position: 'absolute', top: 112, left: 24, zIndex: 1, display: 'flex', gap: 8 }}>{Array.from(firstByEra, ([era, firstIndex]) => <button key={era} type="button" aria-current={steps[index]?.era === era ? 'step' : undefined} data-presentation-active={steps[index]?.era === era ? 'true' : undefined} onClick={() => onGoTo(firstIndex)}>{era}</button>)}</nav>
}
