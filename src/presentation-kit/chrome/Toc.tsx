import type { StepMeta } from '../types'
export function eras(steps: readonly StepMeta[]) {
  return steps.flatMap((s, index) => steps.findIndex(t => t.era === s.era) === index ? [{ era: s.era, index }] : [])
}
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void }) {
  return <nav aria-label="Sections" data-presentation-toc="">
    {eras(steps).map(s => <button key={s.era} onClick={() => jump(s.index)} aria-current={steps[index].era === s.era ? 'step' : undefined} data-presentation-active={steps[index].era === s.era ? 'true' : 'false'}>{s.era}</button>)}
  </nav>
}
