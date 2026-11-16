import type { StepMeta } from '../types'
import { eras } from '../eras'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void }) {
  return <nav aria-label="Sections" data-presentation-toc="">
    {eras(steps).map(s => <button key={s.era} onClick={() => jump(s.index)} aria-current={steps[index].era === s.era ? 'step' : undefined} data-presentation-active={steps[index].era === s.era ? 'true' : 'false'}>{s.era}</button>)}
  </nav>
}
