import type { Step } from '../types'
export function Toc<T>({ steps, index, goTo }: { steps: readonly Step<T>[]; index: number; goTo: (i: number) => void }) {
  const eras = [...new Set(steps.map((s) => s.era))]
  return <nav className="presentation-toc" data-presentation-toc aria-label="Sections">{eras.map((era) => { const i = steps.findIndex((s) => s.era === era); return <button key={era} type="button" aria-current={steps[index]?.era === era ? 'location' : undefined} data-presentation-toc-entry data-presentation-active={steps[index]?.era === era || undefined} onClick={() => goTo(i)}>{era}</button> })}</nav>
}
