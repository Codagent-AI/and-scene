import { blurOnPointer } from './blur.ts'
import type { EraGroup } from '../steps.ts'

interface TocProps {
  eras: EraGroup[]
  index: number
  onJump: (index: number) => void
}

export function Toc({ eras, index, onJump }: TocProps) {
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {eras.map((era) => {
          const active = index >= era.start && index <= era.end
          return (
            <li key={`${era.era}-${era.start}`}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-active={active ? 'true' : 'false'}
                aria-current={active ? 'step' : undefined}
                onClick={(e) => {
                  onJump(era.start)
                  blurOnPointer(e)
                }}
              >
                {era.era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
