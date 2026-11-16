import type { StepMeta } from '../types'
import { eras } from '../model'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 0, top: 120 }}>
    {eras(steps).map(item => <button key={item.era} data-presentation-toc-item="" data-presentation-active={item.era === steps[index].era ? 'true' : 'false'} aria-current={item.era === steps[index].era ? 'step' : undefined} onClick={() => jump(item.index)}>{item.era}</button>)}
  </nav>
}
