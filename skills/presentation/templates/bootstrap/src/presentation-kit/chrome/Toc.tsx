import type { StepMeta } from '../types'
export function Toc({ steps, index, goTo }: { steps: readonly StepMeta[]; index: number; goTo: (index: number) => void }) {
  const eras = [...new Set(steps.map(step => step.era))]
  return <nav className="presentation-toc" style={{ position: 'absolute', top: '50%', left: 0, zIndex: 2 }} aria-label="Sections" data-presentation-toc="">
    {eras.map(era => { const activeIndex = steps.findIndex(step => step.era === era); const active = index >= activeIndex && (eras.indexOf(era) === eras.length - 1 || index < steps.findIndex(step => step.era === eras[eras.indexOf(era) + 1]));
      return <button key={era} type="button" aria-current={active ? 'location' : undefined} data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'} onClick={() => goTo(activeIndex)}>{era}</button> })}
  </nav>
}
