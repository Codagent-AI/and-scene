import type { StepMeta } from '../types'
export function Toc({ steps, index, goTo }: { steps: readonly StepMeta[]; index: number; goTo: (index: number) => void }) {
  const eras = [...new Set(steps.map(step => step.era))]
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 24, top: '40%', width: 150 }}>
    {eras.map(era => <button key={era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === era ? 'true' : 'false'} aria-current={steps[index].era === era ? 'step' : undefined} onClick={() => goTo(steps.findIndex(step => step.era === era))}>{era}</button>)}
  </nav>
}
