import type { Step } from '../types'

type TocProps<TPayload> = { steps: readonly Step<TPayload>[]; activeIndex: number; onSelect: (index: number) => void }

export function Toc<TPayload>({ steps, activeIndex, onSelect }: TocProps<TPayload>) {
  const eras = [...new Set(steps.map((step) => step.era))]
  return (
    <nav className="presentation-toc" data-presentation-toc aria-label="Presentation sections">
      {eras.map((era) => {
        const index = steps.findIndex((step) => step.era === era)
        const active = steps[activeIndex]?.era === era
        return <button key={era} type="button" data-presentation-toc-item data-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} onClick={() => onSelect(index)}>{era}</button>
      })}
    </nav>
  )
}
