import type { StepMeta } from '../types'
import { eras } from './eras'
export function Toc({ steps, index, go, compact = false }: { compact?: boolean; steps: readonly StepMeta[]; index: number; go: (index: number) => void }) {
  return <nav aria-label="Sections" data-presentation-toc="" style={compact ? { position: 'relative', top: 'auto', left: 'auto', right: 'auto', margin: '0 24px' } : undefined}>{eras(steps).map(e => <button key={e.era} aria-current={steps[index].era === e.era ? 'step' : undefined} data-presentation-active={steps[index].era === e.era ? 'true' : 'false'} onClick={() => go(e.index)}>{e.era}</button>)}</nav>
}
