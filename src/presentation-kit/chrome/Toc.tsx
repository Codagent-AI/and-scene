import type { Step } from '../types'

export function Toc<T>({ steps, index, onGoTo }: { steps: readonly Step<T>[]; index: number; onGoTo: (index: number) => void }) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" aria-label="Sections" data-presentation-toc="">
    {eras.map((era) => {
      const first = steps.findIndex((step) => step.era === era)
      const active = steps[index]?.era === era
      return <button type="button" key={era} className="presentation-toc-item" data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'location' : undefined} onClick={() => onGoTo(first)}>{era}</button>
    })}
  </nav>
}
