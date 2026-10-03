import type { Step } from '../types.js'
export function Toc<T>({ steps, index, onGoTo }: { steps: readonly Step<T>[]; index: number; onGoTo: (index: number) => void }) {
  const eras = [...new Set(steps.map(step => step.era))]
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">{eras.map(era => { const first = steps.findIndex(step => step.era === era); const active = steps[index].era === era; return <button key={era} type="button" onClick={() => onGoTo(first)} aria-current={active ? 'location' : undefined} className={`presentation-toc-item${active ? ' is-active' : ''}`} data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'}>{era}</button> })}</nav>
}
