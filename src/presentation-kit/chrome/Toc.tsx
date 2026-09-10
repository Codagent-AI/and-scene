import { useEffect, useState } from 'react'
import type { Step } from '../types'

type TocProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  index: number
  goTo: (index: number) => void
}

export function Toc<TPayload>({ steps, index, goTo }: TocProps<TPayload>) {
  const [wide, setWide] = useState(() => window.innerWidth >= 900)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 900)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  if (!wide) return null
  const eras = steps.reduce<Array<{ era: string; firstIndex: number }>>((all, step, stepIndex) => {
    if (!all.some(({ era }) => era === step.era)) all.push({ era: step.era, firstIndex: stepIndex })
    return all
  }, [])
  const currentEra = steps[index]?.era
  return (
    <nav aria-label="Presentation sections" data-presentation-toc="true">
      {eras.map(({ era, firstIndex }) => {
        const active = era === currentEra
        return <button key={era} type="button" aria-current={active ? 'step' : undefined} data-presentation-active={active ? 'true' : undefined} onClick={() => goTo(firstIndex)}>Go to {era}</button>
      })}
    </nav>
  )
}
