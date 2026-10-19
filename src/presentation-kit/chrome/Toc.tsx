import type { CSSProperties } from 'react'
import type { EraEntry } from '../eras'
import { dataHooks, type DataHooks } from '../nodes/geometry'

interface TocProps extends DataHooks {
  className?: string
  style?: CSSProperties
  entries: readonly EraEntry[]
  activeEra: string
  onGoTo: (index: number) => void
}

export function Toc({ entries, activeEra, onGoTo, className, style, ...hooks }: TocProps) {
  return (
    <nav {...dataHooks(hooks)} data-presentation-toc="" aria-label="Table of contents" className={className} style={style}>
      {entries.map((e) => (
        <button
          key={e.era}
          type="button"
          data-presentation-toc-item=""
          data-presentation-active={e.era === activeEra ? 'true' : undefined}
          aria-current={e.era === activeEra ? 'step' : undefined}
          onClick={() => onGoTo(e.firstIndex)}
        >
          {e.era}
        </button>
      ))}
    </nav>
  )
}
