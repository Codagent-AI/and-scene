import type { Step } from '../types'
export function Toc<T>({ steps, activeIndex, onSelect }: { steps: readonly Step<T>[]; activeIndex: number; onSelect: (index: number) => void }) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">
    {eras.map((era) => {
      const index = steps.findIndex((step) => step.era === era)
      const active = steps[activeIndex]?.era === era
      return <button type="button" key={era} className="presentation-toc__item" data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} onClick={() => onSelect(index)}>{era}</button>
    })}
  </nav>
}
