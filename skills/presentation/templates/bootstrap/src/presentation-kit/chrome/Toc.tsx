import { activeAttrs } from './active'
import type { HTMLAttributes } from 'react'
import { eraEntries } from '../validate'
import type { StepMeta } from '../types'

export interface TocProps extends HTMLAttributes<HTMLElement> {
  steps: readonly StepMeta[]
  index: number
  top: number
  onJump: (index: number) => void
}

export function Toc({ steps, index, top, onJump, style, ...rest }: TocProps) {
  const activeEra = steps[index]?.era
  return (
    <nav data-presentation-toc="" aria-label="Sections" {...rest} style={{ position: 'absolute', left: 0, top, ...style }}>
      <ol>
        {eraEntries(steps).map(({ era, firstIndex }) => {
          const active = era === activeEra
          return (
            <li key={era}>
              <button
                type="button"
                data-presentation-toc-entry=""
                {...activeAttrs(active)}
                onClick={() => onJump(firstIndex)}
              >
                {era}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
