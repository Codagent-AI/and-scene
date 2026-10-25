import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (index: number) => void }) {
  const eras = steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, index: i }] : [])
  return <nav aria-label="Sections" data-presentation-toc="" style={{ position: 'absolute', left: 0, top: 150 }}>
    {eras.map(({ era, index: target }) => <button key={era} onClick={() => jump(target)} aria-current={steps[index].era === era ? 'step' : undefined} data-presentation-toc-item="" data-presentation-active={steps[index].era === era ? 'true' : 'false'}>{era}</button>)}
  </nav>
}
