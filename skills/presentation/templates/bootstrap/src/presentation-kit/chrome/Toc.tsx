import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void }) {
 const eras = steps.map((s, i) => ({ era: s.era, index: i })).filter((s, i, all) => all.findIndex(e => e.era === s.era) === i)
 return <nav data-presentation-toc aria-label="Sections">{eras.map(s => <button key={s.era} data-presentation-active={steps[index].era === s.era} aria-current={steps[index].era === s.era ? 'step' : undefined} onClick={() => jump(s.index)}>{s.era}</button>)}</nav>
}
