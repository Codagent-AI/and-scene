import type { Step } from '../types'
export function Toc<T>({ steps, index, goTo }: { steps: readonly Step<T>[]; index: number; goTo: (i: number) => void }) {
  const eras = [...new Set(steps.map(step => step.era))]
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc>{eras.map(era => { const i = steps.findIndex(s => s.era === era); const active = steps[index]?.era === era; return <button type="button" key={era} onClick={() => goTo(i)} aria-current={active ? 'location' : undefined} data-presentation-toc-entry data-presentation-active={active ? 'true' : undefined}>{era}</button> })}</nav>
}
