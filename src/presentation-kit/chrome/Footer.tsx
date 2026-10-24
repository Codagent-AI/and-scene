import type { PresentationMode, Step } from '../types'

interface FooterProps<T> {
  height: number
  steps: Step<T>[]
  index: number
  mode: PresentationMode
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

export function Footer<T>({ height, steps, index, mode, onPrev, onNext, onJump }: FooterProps<T>) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer=""
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <h2 data-presentation-title="" style={{ margin: 0 }}>
        {step.title}
      </h2>
      {browse ? (
        <>
          <p data-presentation-caption="" style={{ margin: 0 }}>
            {step.caption}
          </p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              data-presentation-prev=""
              aria-label="Previous step"
              disabled={index === 0}
              onClick={onPrev}
            >
              Prev
            </button>
            <nav
              data-presentation-progress=""
              aria-label="Step progress"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  data-presentation-progress-item=""
                  data-presentation-active={i === index ? 'true' : 'false'}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => onJump(i)}
                />
              ))}
            </nav>
            <button
              type="button"
              data-presentation-next=""
              aria-label="Next step"
              disabled={index === steps.length - 1}
              onClick={onNext}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </footer>
  )
}
