import type { Step } from '../types'
export function Toc<T>({ steps, index, onSelect }: { steps: Step<T>[]; index: number; onSelect: (index: number) => void }) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">
    {eras.map((era) => {
      const first = steps.findIndex((step) => step.era === era)
      const active = steps[index]?.era === era
      return <button key={era} type="button" onClick={() => onSelect(first)} aria-current={active ? 'step' : undefined} data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'}>{era}</button>
    })}
  </nav>
}
