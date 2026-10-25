import type { HTMLAttributes } from 'react'
import type { StepMeta } from '../types'
export function Toc({ steps, index, jump, ...props }: HTMLAttributes<HTMLElement> & { steps: readonly StepMeta[]; index: number; jump: (i: number) => void }) {
  const eras = steps.flatMap((s, i) => steps.findIndex(t => t.era === s.era) === i ? [{ era: s.era, i }] : [])
  return <nav aria-label="Sections" data-presentation-toc="" {...props}>{eras.map(e => <button key={e.era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === e.era ? 'true' : undefined} aria-current={steps[index].era === e.era ? 'step' : undefined} onClick={() => jump(e.i)}>{e.era}</button>)}</nav>
}
