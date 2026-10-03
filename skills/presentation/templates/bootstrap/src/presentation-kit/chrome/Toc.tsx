import { useEffect, useState } from 'react'
import type { StepMeta } from '../types'

export function Toc({ steps, index, goTo }: { steps: readonly StepMeta[]; index: number; goTo: (index: number) => void }) {
  const [wide, setWide] = useState(() => window.innerWidth >= 1100)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 1100)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  if (!wide) return null
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" aria-label="Presentation sections" data-presentation-toc="">
    {eras.map((era) => { const eraIndex = steps.findIndex((step) => step.era === era); const active = steps[index]?.era === era; return <button key={era} type="button" className="presentation-toc__entry" aria-current={active ? 'location' : undefined} data-presentation-toc-entry="" data-presentation-active={active ? 'true' : undefined} onClick={() => goTo(eraIndex)}>{era}</button> })}
  </nav>
}
