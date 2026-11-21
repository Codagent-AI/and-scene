import type { ReactNode } from 'react'
import type { Mode, StepMeta } from '../types'

export const attributionUrl = 'https://github.com/Codagent-AI/and-scene'

export function Footer({ steps, index, mode, next, previous, jump, attribution }: {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  next: () => void
  previous: () => void
  jump: (step: number) => void
  attribution?: ReactNode
}) {
  return (
    <footer data-presentation-footer="" style={{ display: 'grid' }}>
      {mode === 'browse' && <>
        <p data-presentation-caption="" aria-live="polite">{steps[index].caption}</p>
        <nav data-presentation-navigation="" aria-label="Step navigation">
          <button type="button" data-presentation-previous="" disabled={index === 0} onClick={previous}>Previous</button>
          <div data-presentation-progress="">
            {steps.map((step, position) => (
              <button key={step.id} type="button" data-presentation-progress-step=""
                data-presentation-active={position === index || undefined}
                aria-current={position === index ? 'step' : undefined}
                aria-label={`Step ${position + 1}: ${step.title}`}
                onClick={() => jump(position)} />
            ))}
          </div>
          <button type="button" data-presentation-next="" disabled={index === steps.length - 1} onClick={next}>Next</button>
        </nav>
      </>}
      <div style={{ justifySelf: 'end' }}>
        {attribution === undefined
          ? <a data-presentation-attribution="" href={attributionUrl}>made by and-scene</a>
          : attribution}
      </div>
    </footer>
  )
}
