import { useEffect, useState } from 'react'
import type { StepMeta } from '../types'
export function Toc({ steps, index, goTo }: { steps: readonly StepMeta[]; index: number; goTo: (index: number) => void }) {
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 900px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px)')
    const update = () => setWide(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  if (!wide) return null
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav aria-label="Table of contents" data-presentation-toc="true">{eras.map((era) => {
    const firstIndex = steps.findIndex((step) => step.era === era)
    const active = steps[index]?.era === era
    return <button key={era} type="button" aria-current={active ? 'step' : undefined} data-presentation-toc-item="true" data-presentation-active={active ? 'true' : undefined} onClick={() => goTo(firstIndex)}>{era}</button>
  })}</nav>
}
