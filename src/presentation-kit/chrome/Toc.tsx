import { hookAttrs, HOOK } from '../hooks'
import { eraOf, eraStarts } from '../stepModel'
import type { StepMeta } from '../types'

export interface TocProps {
  title: string
  steps: ReadonlyArray<StepMeta>
  index: number
  top: number
  bottom: number
  width: number
  onGoTo: (index: number) => void
}

/** Era-based table of contents. Browse mode, wide viewports only. */
export function Toc({ title, steps, index, top, bottom, width, onGoTo }: TocProps) {
  const starts = eraStarts(steps)
  const activeEra = eraOf(starts, index)
  return (
    <nav
      aria-label={`${title} contents`}
      {...hookAttrs(HOOK.toc)}
      style={{ position: 'absolute', left: 0, top, bottom, width, overflowY: 'auto' }}
    >
      <div>
        {starts.map((start, position) => {
          const active = position === activeEra
          return (
            <div key={`${start.firstIndex}-${start.era}`}>
              <button
                type="button"
                {...hookAttrs(HOOK.tocEntry)}
                {...hookAttrs(HOOK.active, active ? 'true' : 'false')}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(start.firstIndex)}
              >
                {start.era}
              </button>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
