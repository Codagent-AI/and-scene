import type { StepMeta } from '../types'
function eraEntries(steps: readonly StepMeta[]) {
  return steps.flatMap((step, index) => steps.findIndex(s => s.era === step.era) === index ? [{ era: step.era, index }] : [])
}
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (index: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', top: 160, left: 24, width: 155 }}>
    {eraEntries(steps).map(entry => <button key={entry.era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === entry.era ? 'true' : 'false'} aria-current={steps[index].era === entry.era ? 'step' : undefined} onClick={() => jump(entry.index)}>{entry.era}</button>)}
  </nav>
}
