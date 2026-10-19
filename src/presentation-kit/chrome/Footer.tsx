import type { Mode } from '../constants'

export interface FooterProps {
  mode: Mode
  index: number
  count: number
  title: string
  caption: string
  stepTitles: string[]
  onJump: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onToggleMode: () => void
}

export function Footer({ mode, index, count, title, caption, stepTitles, onJump, onPrev, onNext, onToggleMode }: FooterProps) {
  const browse = mode === 'browse'
  return (
    <footer
      data-presentation-footer=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 32,
        boxSizing: 'border-box',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', maxWidth: '100%', minWidth: 0 }}>
        <span data-presentation-marker="">{index + 1}</span>
        <h1
          data-presentation-title=""
          style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
        >
          {title}
        </h1>
      </div>
      {browse ? (
        <>
          <p data-presentation-caption="" style={{ maxWidth: 640, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
            {caption}
          </p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button type="button" data-presentation-prev="" aria-disabled={index === 0} onClick={onPrev}>
              Previous
            </button>
            <nav data-presentation-progress="" aria-label="Step progress" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  data-presentation-progress-item=""
                  data-presentation-active={i === index ? 'true' : undefined}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${stepTitles[i]}`}
                  onClick={() => onJump(i)}
                />
              ))}
            </nav>
            <button type="button" data-presentation-next="" aria-disabled={index === count - 1} onClick={onNext}>
              Next
            </button>
            <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
              Present
            </button>
          </div>
        </>
      ) : null}
    </footer>
  )
}
