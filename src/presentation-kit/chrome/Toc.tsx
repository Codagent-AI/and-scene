import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void }) {
  const eras = steps.flatMap((step, n) => steps.findIndex(s => s.era === step.era) === n ? [{ era: step.era, first: n }] : [])
  return <nav data-presentation-toc="" aria-label="Sections">{eras.map(({ era, first }) => <button key={era} aria-current={era === steps[index].era ? 'step' : undefined} data-presentation-active={era === steps[index].era ? 'true' : 'false'} onClick={() => jump(first)}>{era}</button>)}</nav>
}
