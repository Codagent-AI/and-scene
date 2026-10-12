import type { StepMeta } from '../types'
export function Toc({ steps, index, onJump }: { steps: readonly StepMeta[]; index: number; onJump: (index: number) => void }) {
 const eras = steps.map(step => ({ label: step.section, index: steps.findIndex(s => s.section === step.section) })).filter((entry, i, all) => all.findIndex(other => other.label === entry.label) === i)
 return <nav data-presentation-toc aria-label="Presentation sections">{eras.map(era => <button key={era.label} type="button" data-presentation-toc-entry data-active={steps[index]?.section === era.label ? 'true' : 'false'} aria-current={steps[index]?.section === era.label ? 'step' : undefined} onClick={() => onJump(era.index)}>{era.label}</button>)}</nav>
}
