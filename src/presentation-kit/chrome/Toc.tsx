import { useEffect, useState } from 'react'
import type { Step } from '../types'

interface TocProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  onGoTo: (index: number) => void
}

function useWideViewport() {
  const [wide, setWide] = useState(() => window.innerWidth >= 720)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 720)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return wide
}

export function Toc<TPayload>({ steps, index, onGoTo }: TocProps<TPayload>) {
  const wide = useWideViewport()
  if (!wide) return null
  const eras = steps.reduce<{ era: string; firstIndex: number }[]>((result, step, stepIndex) => {
    if (!result.some((entry) => entry.era === step.era)) result.push({ era: step.era, firstIndex: stepIndex })
    return result
  }, [])
  return <nav aria-label="Presentation sections" data-presentation-toc style={{ gridRow: 2 }}>
    {eras.map(({ era, firstIndex }) => {
      const active = steps[index].era === era
      return <button key={era} type="button" aria-current={active ? 'step' : undefined} data-presentation-toc-item data-presentation-active={active || undefined} onClick={() => onGoTo(firstIndex)}>{era}</button>
    })}
  </nav>
}
