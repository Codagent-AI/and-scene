import { CHROME, type Mode } from '../constants'

export interface FooterProps {
  mode: Mode
  index: number
  stepIds: readonly string[]
  stepTitles: readonly string[]
  title: string
  caption: string
  onPrev: () => void
  onNext: () => void
  onGoTo: (index: number) => void
}

export function Footer({ mode, index, stepIds, stepTitles, title, caption, onPrev, onNext, onGoTo }: FooterProps) {
  const present = mode === 'present'
  return (
    <footer
      data-presentation-footer
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: CHROME.attributionH,
        height: CHROME.footerH[mode],
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {present ? (
        <h1 data-presentation-title>{title}</h1>
      ) : (
        <>
          <p data-presentation-caption>{caption}</p>
          <div
            data-presentation-controls
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <button type="button" data-presentation-prev aria-disabled={index === 0} onClick={onPrev}>
              Previous
            </button>
            <div data-presentation-progress style={{ display: 'flex', alignItems: 'center' }}>
              {stepIds.map((id, i) => {
                const active = i === index
                return (
                  <button
                    key={id}
                    type="button"
                    data-presentation-progress-item={id}
                    aria-label={`Step ${i + 1}: ${stepTitles[i]}`}
                    aria-current={active ? 'step' : undefined}
                    data-presentation-active={active ? 'true' : undefined}
                    onClick={() => onGoTo(i)}
                  />
                )
              })}
            </div>
            <button
              type="button"
              data-presentation-next
              aria-disabled={index === stepIds.length - 1}
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
