import { STAGE_LAYOUT } from '../constants.ts'
import type { Mode, StepMeta } from '../types.ts'

interface FooterProps {
  meta: StepMeta
  mode: Mode
  titles: readonly string[]
  onPrev: () => void
  onNext: () => void
  onJump: (index: number) => void
}

function blurAfterPointer(e: React.MouseEvent<HTMLElement>) {
  // A pointer click leaves focus on the control, which would then keep the arrow keys.
  if (e.detail > 0) e.currentTarget.blur()
}

/** Present mode: the one-line title. Browse mode: caption, progress dots, prev/next. */
export function Footer({ meta, mode, titles, onPrev, onNext, onJump }: FooterProps) {
  const style = { position: 'absolute', left: 0, right: 0, bottom: 0, height: STAGE_LAYOUT[mode].bottom } as const
  if (mode === 'present') {
    return (
      <footer data-presentation-footer="" style={style}>
        <p data-presentation-title="">{meta.title}</p>
      </footer>
    )
  }
  return (
    <footer data-presentation-footer="" style={style}>
      <p data-presentation-caption="">{meta.caption}</p>
      <nav data-presentation-progress="" aria-label="Progress">
        {titles.map((title, i) => {
          const active = i === meta.index
          return (
            <button
              key={i}
              type="button"
              data-presentation-dot=""
              data-presentation-active={active ? 'true' : undefined}
              aria-current={active ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${title}`}
              onClick={(e) => {
                onJump(i)
                blurAfterPointer(e)
              }}
            />
          )
        })}
      </nav>
      <div data-presentation-controls="">
        <button
          type="button"
          data-presentation-prev=""
          aria-label="Previous step"
          onClick={(e) => {
            onPrev()
            blurAfterPointer(e)
          }}
        >
          Previous
        </button>
        <button
          type="button"
          data-presentation-next=""
          aria-label="Next step"
          onClick={(e) => {
            onNext()
            blurAfterPointer(e)
          }}
        >
          Next
        </button>
      </div>
    </footer>
  )
}
