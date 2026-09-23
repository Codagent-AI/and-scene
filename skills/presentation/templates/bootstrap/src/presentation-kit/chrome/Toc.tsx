import type { Step } from '../types'

export function Toc<TPayload>({ steps, index, goTo }: { steps: readonly Step<TPayload>[]; index: number; goTo: (index: number) => void }) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" data-presentation-toc aria-label="Presentation sections">
    {eras.map((era) => {
      const target = steps.findIndex((step) => step.era === era)
      const active = steps[index]?.era === era
      return <button key={era} type="button" className="presentation-toc-item" data-presentation-toc-item data-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} onClick={() => goTo(target)}>{era}</button>
    })}
  </nav>
}
