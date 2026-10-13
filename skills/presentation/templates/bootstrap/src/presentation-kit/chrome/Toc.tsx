import type { StepMeta } from '../types'

export function Toc({ steps, index, jump, top }: { steps: readonly StepMeta[]; index: number; jump: (index: number) => void; top: number }) {
  const eras = new Map<string, number>()
  steps.forEach((step, i) => { if (!eras.has(step.era)) eras.set(step.era, i) })
  return <nav data-presentation-toc aria-label="Table of contents" style={{ position: 'absolute', top, left: 24, width: 176 }}>
    {Array.from(eras, ([era, first]) => <button key={era} data-presentation-toc-item
      data-presentation-active={steps[index].era === era ? 'true' : undefined}
      aria-current={steps[index].era === era ? 'true' : undefined} onClick={() => jump(first)}>{era}</button>)}
  </nav>
}
