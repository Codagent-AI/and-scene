import type { StepMeta } from '../types'
export function Toc({ steps, index, go }: { steps: StepMeta[]; index: number; go: (index: number) => void }) {
  const eras = steps.filter((step,i) => steps.findIndex(other => other.era === step.era) === i)
  return <nav data-presentation-toc="" aria-label="Sections">{eras.map(step => <button key={step.era} aria-current={step.era === steps[index].era ? 'step' : undefined} data-active={step.era === steps[index].era} onClick={() => go(steps.indexOf(step))}>{step.era}</button>)}</nav>
}
