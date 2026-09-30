import { useEffect, useState } from 'react'
import type { Step } from '../types'

interface TocProps<TPayload> {
  steps: readonly Step<TPayload>[]
  activeIndex: number
  onGoTo: (index: number) => void
}

function useWideViewport() {
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= 900)

  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 900)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return wide
}

export function Toc<TPayload>({ steps, activeIndex, onGoTo }: TocProps<TPayload>) {
  const wide = useWideViewport()
  if (!wide) return null

  const eras = steps.reduce<Array<{ era: string; index: number }>>((items, step, index) => {
    if (!items.some((item) => item.era === step.era)) items.push({ era: step.era, index })
    return items
  }, [])
  const activeEra = steps[activeIndex]?.era

  return (
    <nav aria-label="Presentation sections" data-presentation-toc="true">
      {eras.map(({ era, index }) => {
        const active = era === activeEra
        return (
          <button
            aria-current={active ? 'step' : undefined}
            data-presentation-toc-active={active ? 'true' : undefined}
            data-presentation-toc-era={era}
            key={era}
            onClick={() => onGoTo(index)}
            type="button"
          >
            {era}
          </button>
        )
      })}
    </nav>
  )
}
