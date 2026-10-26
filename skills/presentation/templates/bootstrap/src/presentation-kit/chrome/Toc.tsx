import type { StepMeta } from '../types'
export function eraStarts(steps: readonly StepMeta[]) {
  return steps.flatMap((step, i) => i === 0 || step.era !== steps[i - 1].era ? [{ era: step.era, index: i }] : [])
}
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (i: number) => void }) {
  const eras = eraStarts(steps)
  return <nav aria-label="Table of contents" data-presentation-toc="">{eras.map((era, i) => { const active = index >= era.index && (i === eras.length - 1 || index < eras[i + 1].index); return <button key={era.index} data-presentation-toc-entry="" data-presentation-active={String(active)} aria-current={active ? 'step' : undefined} onClick={() => go(era.index)}>{era.era}</button> })}</nav>
}
