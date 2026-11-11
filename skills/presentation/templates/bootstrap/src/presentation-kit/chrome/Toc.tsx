import type { StepMeta } from '../types'
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (index: number) => void }) {
  const sections = steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, index: i }] : [])
  return <nav data-presentation-toc="" aria-label="Sections">{sections.map(section => {
    const active = steps[index].era === section.era
    return <button key={section.era} data-presentation-toc-entry="" data-active={active} aria-current={active ? 'step' : undefined} onClick={() => go(section.index)}>{section.era}</button>
  })}</nav>
}
