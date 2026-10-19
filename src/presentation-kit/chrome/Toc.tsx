import type { CSSProperties } from 'react'
import { STAGE_LAYOUT, TOC_W } from '../constants'
import type { Step } from '../types'
import { tocEntries } from './tocEntries'

export interface TocProps {
  steps: ReadonlyArray<Pick<Step<unknown>, 'era'>>
  index: number
  onGoTo: (index: number) => void
  className?: string
  style?: CSSProperties
}

export function Toc({ steps, index, onGoTo, className, style, ...rest }: TocProps) {
  const entries = tocEntries(steps)
  const activeEra = steps[index].era
  return (
    <nav
      {...rest}
      aria-label="Table of contents"
      data-presentation-toc=""
      className={className}
      style={{
        position: 'absolute',
        left: 0,
        top: STAGE_LAYOUT.browse.header,
        bottom: STAGE_LAYOUT.browse.footer,
        width: TOC_W,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style,
      }}
    >
      {entries.map((e) => {
        const active = e.era === activeEra
        return (
          <button
            key={`${e.era}:${e.first}`}
            type="button"
            data-presentation-toc-entry=""
            data-presentation-active={active ? 'true' : undefined}
            aria-current={active ? 'true' : undefined}
            onClick={() => onGoTo(e.first)}
          >
            {e.era}
          </button>
        )
      })}
    </nav>
  )
}
