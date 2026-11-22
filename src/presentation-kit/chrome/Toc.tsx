import type { StepMeta } from '../types'
import { eras } from './eras'

export function Toc({ steps, index, jump }: { steps: readonly StepMeta[], index: number, jump: (index: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 0, top: 116 }}>
    {eras(steps).map(entry => {
      const active = steps[index].era === entry.era
      return <button type="button" key={entry.era} aria-current={active ? 'step' : undefined} data-presentation-active={active} onClick={() => jump(entry.index)}>{entry.era}</button>
    })}
  </nav>
}
