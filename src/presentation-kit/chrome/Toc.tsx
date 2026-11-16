import type { StepMeta } from '../types'
export function Toc({ steps, index, go }: { steps: StepMeta[]; index: number; go: (n: number) => void }) {
  const eras = steps.flatMap((s, i) => steps.findIndex(other => other.era === s.era) === i ? [{ era: s.era, first: i }] : [])
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', top: 160, left: 24, width: 160, display: 'grid' }}>{eras.map(({ era, first }) => <button key={era} data-presentation-toc-entry="" data-presentation-active={steps[index].era === era} aria-current={steps[index].era === era ? 'step' : undefined} onClick={() => go(first)}>{era}</button>)}</nav>
}
