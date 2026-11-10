import type { StepMeta } from '../types'
export function eras(steps: readonly StepMeta[]) { return steps.flatMap((s, i) => steps.findIndex(x => x.era === s.era) === i ? [{ era: s.era, index: i }] : []) }
export function Toc({ steps, index, jump, wide }: { steps: readonly StepMeta[]; index: number; jump: (i: number) => void; wide: boolean }) {
  if (!wide) return null
  return <nav data-presentation-toc="" aria-label="Sections">{eras(steps).map(s => <button key={s.era} onClick={() => jump(s.index)} aria-current={steps[index].era === s.era ? 'step' : undefined} data-presentation-active={steps[index].era === s.era ? 'true' : 'false'}>{s.era}</button>)}</nav>
}
