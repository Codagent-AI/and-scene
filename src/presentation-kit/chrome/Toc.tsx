import type { StepMeta } from '../types'
export function eraEntries(steps: readonly StepMeta[]) {
  return steps.flatMap((step, index) => index === 0 || step.era !== steps[index - 1].era ? [{ era: step.era, index }] : [])
}
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (i: number) => void }) {
  const entries = eraEntries(steps)
  const active = entries.findLast(entry => entry.index <= index)
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 24, top: '35%', width: 170 }}>
    {entries.map(entry => <button key={entry.index} data-presentation-toc-entry="" data-presentation-active={entry === active ? 'true' : 'false'} aria-current={entry === active ? 'step' : undefined} onClick={() => jump(entry.index)}>{entry.era}</button>)}
  </nav>
}
