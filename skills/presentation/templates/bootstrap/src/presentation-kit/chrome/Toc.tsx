import type { Step } from '../types'

type TocProps<TPayload> = { steps: readonly Step<TPayload>[]; stepIndex: number; onGoTo: (index: number) => void }

export function Toc<TPayload>({ steps, stepIndex, onGoTo }: TocProps<TPayload>) {
  const eras = steps.reduce<{ label: string; index: number }[]>((all, step, index) => {
    if (!all.some((era) => era.label === step.era)) all.push({ label: step.era, index })
    return all
  }, [])

  return (
    <nav aria-label="Presentation sections" data-presentation-toc="true">
      {eras.map((era) => {
        const active = steps[stepIndex]?.era === era.label
        return (
          <button
            aria-current={active ? 'step' : undefined}
            aria-label={`Go to era: ${era.label}`}
            data-presentation-toc-entry="true"
            data-presentation-toc-active={active || undefined}
            key={era.label}
            onClick={() => onGoTo(era.index)}
            type="button"
          >
            {era.label}
          </button>
        )
      })}
    </nav>
  )
}
