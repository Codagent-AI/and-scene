import type { Mode, StepMeta } from '../types.ts'
import { stepNumber } from './sections.ts'

export interface FooterProps {
  steps: readonly StepMeta[]
  index: number
  mode: Mode
  onJump: (index: number) => void
  onNext: () => void
  onPrev: () => void
}

const blurOnPointer = (e: { detail: number; currentTarget: HTMLElement }) => {
  if (e.detail > 0) e.currentTarget.blur()
}

export function Footer({ steps, index, mode, onJump, onNext, onPrev }: FooterProps) {
  const step = steps[index]
  const marker = (
    <span data-presentation-marker="">
      {String(stepNumber(index)).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
    </span>
  )
  if (mode === 'present') {
    return (
      <footer
        data-presentation-footer=""
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 16px 40px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          justifyContent: 'center',
        }}
      >
        {marker}
        <h2 data-presentation-step-title="">{step.title}</h2>
      </footer>
    )
  }
  return (
    <footer
      data-presentation-footer=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 184,
        padding: '8px 16px 36px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        {marker}
        <h2 data-presentation-step-title="">{step.title}</h2>
      </div>
      <p data-presentation-step-caption="" style={{ margin: 0 }}>
        {step.caption}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
        <button
          type="button"
          data-presentation-nav-button="prev"
          aria-label="Previous step"
          disabled={index === 0}
          onClick={(e) => {
            onPrev()
            blurOnPointer(e)
          }}
        >
          prev
        </button>
        <nav
          data-presentation-progress=""
          aria-label="Step progress"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}
        >
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-presentation-progress-item=""
              data-active={i === index ? 'true' : 'false'}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Go to step ${stepNumber(i)}: ${s.title}`}
              onClick={(e) => {
                onJump(i)
                blurOnPointer(e)
              }}
            />
          ))}
        </nav>
        <button
          type="button"
          data-presentation-nav-button="next"
          aria-label="Next step"
          disabled={index === steps.length - 1}
          onClick={(e) => {
            onNext()
            blurOnPointer(e)
          }}
        >
          next
        </button>
      </div>
    </footer>
  )
}
