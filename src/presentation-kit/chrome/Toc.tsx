import type { StepMeta } from '../types'
export function eras(steps: readonly StepMeta[]) {
  return steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, index: i }] : [])
}
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (i: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 24, top: 130, width: 150 }}>
    {eras(steps).map(section => <button key={section.era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === section.era} aria-current={steps[index].era === section.era ? 'step' : undefined} onClick={() => go(section.index)}>{section.era}</button>)}
  </nav>
}
