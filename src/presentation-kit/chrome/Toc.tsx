import type { Step } from '../types'

export function Toc<T>({ steps, index, onGoTo }: { steps: readonly Step<T>[]; index: number; onGoTo: (index: number) => void }) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">
    {eras.map((era) => {
      const firstIndex = steps.findIndex((step) => step.era === era)
      const active = steps[index].era === era
      return <button type="button" key={era} className="presentation-toc-item" data-presentation-toc-item="" data-active={active ? 'true' : 'false'} aria-current={active ? 'location' : undefined} onClick={() => onGoTo(firstIndex)}>{era}</button>
    })}
  </nav>
}
