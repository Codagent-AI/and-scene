import type { PresentationStep } from '../types'
import { activation } from './activation'
import { eraEntries } from './eras'

interface TocProps {
  steps: readonly PresentationStep[]
  index: number
  onGoTo: (index: number) => void
}

export function Toc({ steps, index, onGoTo }: TocProps) {
  const activeEra = steps[index].era
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      <ol>
        {eraEntries(steps).map(({ era, first }) => {
          const active = era === activeEra
          return (
            <li key={era}>
              <button
                type="button"
                data-presentation-toc-entry=""
                data-presentation-active={active ? 'true' : 'false'}
                aria-current={active ? 'step' : undefined}
                onClick={activation(() => onGoTo(first))}
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
