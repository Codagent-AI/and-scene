import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (index: number) => void }) {
  const eras = steps.flatMap((step, i) => steps.findIndex(item => item.era === step.era) === i ? [{ era: step.era, index: i }] : [])
  return <nav aria-label="Sections" data-presentation-toc="" style={{ position: 'absolute', left: 24, top: 132, width: 160 }}>
    {eras.map(item => <button key={item.era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === item.era ? 'true' : 'false'} aria-current={steps[index].era === item.era ? 'step' : undefined} onClick={() => jump(item.index)}>{item.era}</button>)}
  </nav>
}
