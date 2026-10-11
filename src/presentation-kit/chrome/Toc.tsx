import { useEffect, useState } from 'react'
import type { Step } from '../types'

export function Toc<T>({ steps, index, jumpTo }: { steps: readonly Step<T>[]; index: number; jumpTo: (index: number) => void }) {
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= 900)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 900)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const eras = [...new Set(steps.map((step) => step.era))]
  return <nav aria-label="Table of contents" data-presentation-toc="" hidden={!wide}>
    {eras.map((era) => {
      const target = steps.findIndex((step) => step.era === era)
      const active = steps[index]?.era === era
      return <button key={era} type="button" onClick={() => jumpTo(target)} aria-current={active ? 'step' : undefined} data-presentation-active={active ? '' : undefined}>{era}</button>
    })}
  </nav>
}
