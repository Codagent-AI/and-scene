import type { StepMeta } from '../types'
function eras(steps: readonly StepMeta[]) {
  return steps.flatMap((step, index) => steps.findIndex(s => s.era === step.era) === index ? [{ era: step.era, index }] : [])
}
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections">{eras(steps).map(section => <button key={section.era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === section.era ? 'true' : 'false'} aria-current={steps[index].era === section.era ? 'step' : undefined} onClick={() => jump(section.index)}>{section.era}</button>)}</nav>
}
