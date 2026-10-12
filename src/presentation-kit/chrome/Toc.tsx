import type { Step } from '../types'
export function Toc<T>({ steps, index, onSelect }: { steps: readonly Step<T>[]; index: number; onSelect: (i: number) => void }) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav data-presentation-toc aria-label="Presentation sections">{eras.map((era) => {
    const stepIndex = steps.findIndex((step) => step.era === era)
    const active = steps[index]?.era === era
    return <button key={era} type="button" aria-current={active ? 'step' : undefined} data-presentation-active={active ? 'true' : undefined} onClick={() => onSelect(stepIndex)}>{era}</button>
  })}</nav>
}
