import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (index: number) => void }) {
  const eras = steps.flatMap((step, position) => steps.findIndex(item => item.era === step.era) === position ? [{ era: step.era, position }] : [])
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', top: 130, left: 24, width: 180 }}>
    {eras.map(({ era, position }) => <button key={era} data-presentation-toc-entry="" data-active={steps[index].era === era ? 'true' : 'false'} aria-current={steps[index].era === era ? 'step' : undefined} onClick={() => jump(position)}>{era}</button>)}
  </nav>
}
