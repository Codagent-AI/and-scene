import { hookAttrs, HOOK } from '../hooks'
import type { PresentationMode, StepMeta } from '../types'

export interface FooterProps {
  height: number
  steps: ReadonlyArray<StepMeta>
  index: number
  mode: PresentationMode
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

/** Bottom chrome: caption (browse) or title (present), progress, and prev/next (browse). */
export function Footer({ height, steps, index, mode, onGoTo, onPrev, onNext }: FooterProps) {
  const current = steps[index]
  const browse = mode === 'browse'
  return (
    <footer
      {...hookAttrs(HOOK.footer)}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      {browse ? (
        <div {...hookAttrs(HOOK.caption)}>{current.caption}</div>
      ) : (
        <div {...hookAttrs(HOOK.title)}>{current.title}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {browse ? (
          <button type="button" {...hookAttrs(HOOK.prev)} aria-label="Previous step" disabled={index === 0} onClick={onPrev}>
            Prev
          </button>
        ) : null}
        <nav aria-label="Steps" {...hookAttrs(HOOK.progress)} style={{ display: 'flex' }}>
          {steps.map((step, position) => {
            const active = position === index
            return (
              <button
                key={step.id}
                type="button"
                {...hookAttrs(HOOK.progressItem)}
                {...hookAttrs(HOOK.active, active ? 'true' : 'false')}
                aria-label={`Go to step ${position + 1}: ${step.title}`}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(position)}
              />
            )
          })}
        </nav>
        {browse ? (
          <button type="button" {...hookAttrs(HOOK.next)} aria-label="Next step" disabled={index === steps.length - 1} onClick={onNext}>
            Next
          </button>
        ) : null}
      </div>
    </footer>
  )
}
