import { useEffect, useState } from 'react'
import type { StepMeta } from '../types'

const wideViewport = '(min-width: 900px)'

export function Toc({ steps, index, jump }: {
  steps: readonly StepMeta[]
  index: number
  jump: (step: number) => void
}) {
  const [wide, setWide] = useState(() => window.matchMedia(wideViewport).matches)
  useEffect(() => {
    const query = window.matchMedia(wideViewport)
    const update = () => setWide(query.matches)
    query.addEventListener('change', update)
    update()
    return () => query.removeEventListener('change', update)
  }, [])

  if (!wide) return null

  const eras = new Map<string, number>()
  steps.forEach(({ era }, position) => {
    if (!eras.has(era)) eras.set(era, position)
  })
  return (
    <nav data-presentation-toc="" aria-label="Table of contents">
      {[...eras].map(([era, position]) => {
        const active = era === steps[index].era
        return (
          <button key={era} type="button" data-presentation-era=""
            data-presentation-active={active || undefined} aria-current={active ? 'step' : undefined}
            onClick={() => jump(position)}>{era}</button>
        )
      })}
    </nav>
  )
}
