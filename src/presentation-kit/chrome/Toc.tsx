import type { Step } from '../types'

export function Toc<TPayload>({ steps, index, goTo }: { steps: readonly Step<TPayload>[]; index: number; goTo: (index: number) => void }) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">
    {eras.map((era) => { const target = steps.findIndex((step) => step.era === era); const active = index >= target && (steps.findIndex((step, i) => i > target && step.era !== era) === -1 || index < steps.findIndex((step, i) => i > target && step.era !== era))
      return <button type="button" key={era} className="presentation-toc-item" data-presentation-toc-item="" data-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} onClick={() => goTo(target)}>{era}</button> })}
  </nav>
}
