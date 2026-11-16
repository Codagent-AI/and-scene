import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (i: number) => void }) {
  const eras = steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, index: i }] : [])
  return <nav data-presentation-toc="" aria-label="Sections">{eras.map(item => <button key={item.era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === item.era ? 'true' : 'false'} aria-current={steps[index].era === item.era ? 'step' : undefined} onClick={() => jump(item.index)}>{item.era}</button>)}</nav>
}
