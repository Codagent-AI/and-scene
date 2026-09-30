import { useMemo } from 'react'
import type { Step } from '../types'

export interface TocProps<TPayload> {
  steps: Step<TPayload>[]
  activeIndex: number
  onSelectSection: (firstStepIndex: number) => void
}

interface Era {
  section: string
  firstStepIndex: number
}

/**
 * Era-based table of contents for browse mode. One entry per distinct
 * `section` label, in order of first appearance; activating an entry jumps
 * to the first step of that era.
 */
export function Toc<TPayload>({ steps, activeIndex, onSelectSection }: TocProps<TPayload>) {
  const eras = useMemo<Era[]>(() => {
    const seen = new Set<string>()
    const result: Era[] = []
    steps.forEach((step, index) => {
      if (seen.has(step.section)) return
      seen.add(step.section)
      result.push({ section: step.section, firstStepIndex: index })
    })
    return result
  }, [steps])

  const activeSection = steps[activeIndex]?.section

  return (
    <nav className="sk-toc" data-scene-kit="toc" aria-label="Table of contents">
      <ul className="sk-toc__list">
        {eras.map((era) => {
          const isActive = era.section === activeSection
          return (
            <li key={era.section} className="sk-toc__item">
              <button
                type="button"
                className="sk-toc__entry"
                data-scene-kit="toc-entry"
                data-active={isActive ? 'true' : 'false'}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelectSection(era.firstStepIndex)}
              >
                {era.section}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
