import type { StepMeta } from '../types'
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (index: number) => void }) {
  const eras = [...new Set(steps.map(step => step.era))]
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', top: 68, left: 32, right: 32 }}>
    {eras.map(era => <button key={era} type="button" onClick={() => go(steps.findIndex(step => step.era === era))}
      data-presentation-toc-entry="" data-active={steps[index].era === era}
      aria-current={steps[index].era === era ? 'step' : undefined}>{era}</button>)}
  </nav>
}
