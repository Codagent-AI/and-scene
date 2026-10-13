import type { PresentationMode, StepMeta } from '../types'

export function Footer({ steps, index, mode, jump, prev, next, left, right }: {
  steps: readonly StepMeta[]; index: number; mode: PresentationMode
  jump: (index: number) => void; prev: () => void; next: () => void; left: number; right: number
}) {
  const step = steps[index]
  return <footer style={{ position: 'absolute', bottom: 48, left, right }}>
    {mode === 'present' ? <h1 data-presentation-title>{step.title}</h1> : <>
      <p data-presentation-caption>{step.caption}</p>
      <nav aria-label="Step navigation">
        <button data-presentation-prev disabled={index === 0} onClick={prev} aria-label="Previous step">Previous</button>
        <div data-presentation-progress>
          {steps.map((item, i) => <button key={item.id} data-presentation-progress-item
            data-presentation-active={i === index ? 'true' : undefined}
            aria-current={i === index ? 'step' : undefined}
            aria-label={`Go to step ${i + 1}: ${item.title}`} onClick={() => jump(i)}>{i + 1}</button>)}
        </div>
        <button data-presentation-next disabled={index === steps.length - 1} onClick={next} aria-label="Next step">Next</button>
      </nav>
    </>}
  </footer>
}
