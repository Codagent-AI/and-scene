import type { PresentationMode, Step } from '../types'

type FooterProps<TPayload> = {
  title: string
  steps: readonly Step<TPayload>[]
  index: number
  mode: PresentationMode
  goTo: (index: number) => void
  prev: () => void
  next: () => void
}

export function Footer<TPayload>({ title, steps, index, mode, goTo, prev, next }: FooterProps<TPayload>) {
  const step = steps[index]
  if (!step) return null
  if (mode === 'present') return <footer data-presentation-footer="true" data-presentation-present-footer="true">{title}</footer>
  return (
    <footer data-presentation-footer="true">
      <p data-presentation-caption="true">{step.caption}</p>
      <div data-presentation-controls="true">
        <button type="button" aria-label="Previous step" onClick={prev}>Previous</button>
        <div aria-label="Presentation progress" data-presentation-progress="true">
          {steps.map((candidate, candidateIndex) => {
            const active = candidateIndex === index
            return <button key={candidate.id} type="button" aria-label={`Go to step ${candidateIndex + 1}: ${candidate.title}`} aria-current={active ? 'step' : undefined} data-presentation-active={active ? 'true' : undefined} onClick={() => goTo(candidateIndex)}>{candidateIndex + 1}</button>
          })}
        </div>
        <button type="button" aria-label="Next step" onClick={next}>Next</button>
      </div>
    </footer>
  )
}
