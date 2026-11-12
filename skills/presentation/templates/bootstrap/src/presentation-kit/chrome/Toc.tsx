import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void }) {
  const eras = steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, first: i }] : [])
  return <nav data-presentation-toc="" aria-label="Table of contents">{eras.map(({ era, first }) => <button key={era} data-presentation-toc-item="" data-presentation-active={steps[index].era === era ? 'true' : 'false'} aria-current={steps[index].era === era ? 'step' : undefined} onClick={() => jump(first)}>{era}</button>)}</nav>
}
