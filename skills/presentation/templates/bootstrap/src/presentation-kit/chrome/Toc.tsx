import type { Step } from '../types'

export function Toc<TPayload>({ steps, index, goTo }: { steps: readonly Step<TPayload>[]; index: number; goTo: (index: number) => void }) {
  const sections = [...new Map(steps.map((step) => [step.era, { era: step.era, index: steps.findIndex((item) => item.era === step.era), active: steps[index]?.era === step.era }])).values()]
  return <nav className="presentation-toc" aria-label="Sections" data-presentation-toc="">
    {sections.map((section) => <button key={section.era} type="button" onClick={() => goTo(section.index)} aria-current={section.active ? 'location' : undefined} data-presentation-active={section.active ? 'true' : 'false'} data-presentation-toc-item="">{section.era}</button>)}
  </nav>
}
