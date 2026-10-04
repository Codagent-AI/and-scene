import type { StepMeta } from '../types'

interface TocProps { steps: readonly Pick<StepMeta, 'id' | 'era' | 'title' | 'caption'>[]; index: number; onSelect: (index: number) => void }
export function Toc({ steps, index, onSelect }: TocProps) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" data-presentation-toc="" aria-label="Presentation sections">
    {eras.map((era) => {
      const firstIndex = steps.findIndex((step) => step.era === era)
      const active = steps[index]?.era === era
      return <button type="button" key={era} className="presentation-toc__item" data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} onClick={() => onSelect(firstIndex)}>{era}</button>
    })}
  </nav>
}
