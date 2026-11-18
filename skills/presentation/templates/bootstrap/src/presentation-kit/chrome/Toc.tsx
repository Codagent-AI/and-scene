import type { StepMeta } from '../types'
import { eras } from './eras'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (index: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 0, top: 150 }}>
    {eras(steps).map(item => <button key={item.era} aria-current={steps[index].era === item.era ? 'step' : undefined} data-presentation-active={steps[index].era === item.era ? 'true' : 'false'} onClick={() => jump(item.index)}>{item.era}</button>)}
  </nav>
}
