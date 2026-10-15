import { useEffect, useState } from 'react'
import type { Step } from '../types'
export function Toc<T>({ steps, index, goTo }: { steps: readonly Step<T>[]; index: number; goTo: (index: number) => void }) {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 900px)')
    const update = () => setWide(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  if (!wide) return null
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav data-presentation-toc aria-label="Sections" style={{ display: 'flex', gap: 8 }}>
    {eras.map((era) => { const first = steps.findIndex((step) => step.era === era); const active = steps[index]?.era === era; return <button key={era} type="button" data-presentation-toc-item={era} aria-current={active ? 'step' : undefined} data-presentation-active={active ? 'true' : undefined} onClick={() => goTo(first)}>{era}</button> })}
  </nav>
}
