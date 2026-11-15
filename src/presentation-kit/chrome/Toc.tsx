import type { StepMeta } from '../types'
import { eras } from './eras'
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (index: number) => void }) {
  return <nav aria-label="Sections" data-presentation-toc="">{eras(steps).map(e => <button key={e.era} aria-current={steps[index].era === e.era ? 'step' : undefined} data-presentation-active={steps[index].era === e.era ? 'true' : 'false'} onClick={() => go(e.index)}>{e.era}</button>)}</nav>
}
