import type { StepMeta } from '../types'
export function eras(steps: readonly StepMeta[]) {
  return steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, index: i }] : [])
}
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (index: number) => void }) {
  return <nav data-presentation-toc="" aria-label="Table of contents" style={{ position: 'absolute', left: 24, top: 160 }}>
    {eras(steps).map(({ era, index: first }) => <button key={era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === era} aria-current={steps[index].era === era ? 'step' : undefined} onClick={() => go(first)}>{era}</button>)}
  </nav>
}
