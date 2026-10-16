import type { Mode, StepMeta } from '../types'

interface FooterProps {
  mode: Mode
  steps: readonly StepMeta[]
  index: number
  go: (i: number) => void
  next: () => void
  prev: () => void
}

/** Click handler that also releases focus so keyboard navigation keeps working. */
const press = (fn: () => void) => (e: React.MouseEvent<HTMLElement>) => {
  fn()
  e.currentTarget.blur()
}

export function Footer({ mode, steps, index, go, next, prev }: FooterProps) {
  const step = steps[index]
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" data-presentation-mode="present">
        <h1 data-presentation-title="">{step.title}</h1>
      </footer>
    )
  }
  return (
    <footer data-presentation-footer="" data-presentation-mode="browse">
      <p data-presentation-caption="">{step.caption}</p>
      <nav aria-label="Steps" data-presentation-progress="">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Step ${i + 1}: ${s.title}`}
            aria-current={i === index ? 'step' : undefined}
            data-presentation-dot=""
            data-active={i === index ? 'true' : 'false'}
            onClick={press(() => go(i))}
          />
        ))}
      </nav>
      <div data-presentation-controls="">
        <button type="button" data-presentation-prev="" disabled={index === 0} onClick={press(prev)}>
          Previous
        </button>
        <button type="button" data-presentation-next="" disabled={index === steps.length - 1} onClick={press(next)}>
          Next
        </button>
      </div>
    </footer>
  )
}
