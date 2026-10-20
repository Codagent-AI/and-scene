import type { Step } from '../types.ts'
import type { PresentationMode } from '../types.ts'
import { Toc } from './Toc.tsx'

interface FooterProps {
  steps: readonly Pick<Step, 'id' | 'era' | 'title' | 'caption'>[]
  index: number
  mode: PresentationMode
  showToc: boolean
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export function Footer({ steps, index, mode, showToc, onJump, onPrev, onNext }: FooterProps) {
  const step = steps[index]
  return (
    <footer
      data-presentation-footer=""
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}
    >
      <h2 data-presentation-step-title="">{step.title}</h2>
      {mode === 'browse' && (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          {showToc && <Toc steps={steps} index={index} onJump={onJump} />}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              data-presentation-nav-prev=""
              aria-label="Previous step"
              disabled={index === 0}
              onClick={onPrev}
            >
              Previous
            </button>
            <ol data-presentation-progress="" style={{ display: 'flex' }}>
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-presentation-progress-dot=""
                    data-presentation-active={i === index ? 'true' : 'false'}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    onClick={() => onJump(i)}
                  />
                </li>
              ))}
            </ol>
            <button
              type="button"
              data-presentation-nav-next=""
              aria-label="Next step"
              disabled={index === steps.length - 1}
              onClick={onNext}
            >
              Next
            </button>
          </div>
        </>
      )}
    </footer>
  )
}
