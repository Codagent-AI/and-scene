import type { StepMeta } from '../types'
function eras(steps: readonly StepMeta[]) {
  return steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, index: i }] : [])
}
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (index: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections">{eras(steps).map(s => {
    const active = steps[index].era === s.era
    return <button key={s.era} data-presentation-toc-entry="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} onClick={() => go(s.index)}>{s.era}</button>
  })}</nav>
}
