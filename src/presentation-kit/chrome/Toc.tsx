import type { StepMeta } from '../types'
export function eras(steps: readonly StepMeta[]) {
  return steps.flatMap((step, index) => steps.findIndex(s => s.era === step.era) === index ? [{ era: step.era, index }] : [])
}
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (index: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections">{eras(steps).map(section => {
    const active = steps[index].era === section.era
    return <button key={section.era} data-presentation-toc-entry="" data-active={active} aria-current={active ? 'step' : undefined} onClick={() => go(section.index)}>{section.era}</button>
  })}</nav>
}
