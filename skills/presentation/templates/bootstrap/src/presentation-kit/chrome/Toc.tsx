import type { StepMeta } from '../types'

export function Toc({ steps, activeIndex, onSelect }: { steps: readonly StepMeta[]; activeIndex: number; onSelect: (index: number) => void }) {
  const sections = steps.reduce<{ era: string; index: number }[]>((result, step, index) => result.some((section) => section.era === step.era) ? result : [...result, { era: step.era, index }], [])
  return <nav data-presentation-toc="true" aria-label="Sections">
    {sections.map((section) => <button key={section.era} type="button" data-presentation-toc-item="true" data-active={steps[activeIndex]?.era === section.era ? 'true' : 'false'} aria-current={steps[activeIndex]?.era === section.era ? 'step' : undefined} onClick={() => onSelect(section.index)}>{section.era}</button>)}
  </nav>
}
