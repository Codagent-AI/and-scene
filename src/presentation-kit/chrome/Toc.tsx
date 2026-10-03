import type { Step } from '../types'

export function Toc<TPayload>({ steps, index, goTo }: { steps: readonly Step<TPayload>[]; index: number; goTo: (index: number) => void }) {
  const firstIndexByEra = new Map<string, number>()
  steps.forEach((step, stepIndex) => { if (!firstIndexByEra.has(step.era)) firstIndexByEra.set(step.era, stepIndex) })
  const activeEra = steps[index]?.era
  const sections = [...firstIndexByEra].map(([era, firstIndex]) => ({ era, index: firstIndex, active: era === activeEra }))
  return <nav className="presentation-toc" aria-label="Sections" data-presentation-toc="">
    {sections.map((section) => <button key={section.era} type="button" onClick={() => goTo(section.index)} aria-current={section.active ? 'location' : undefined} data-presentation-active={section.active ? 'true' : 'false'} data-presentation-toc-item="">{section.era}</button>)}
  </nav>
}
