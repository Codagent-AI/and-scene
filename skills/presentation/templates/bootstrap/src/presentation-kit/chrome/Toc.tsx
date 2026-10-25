import { useEffect, useState } from 'react'
import type { StepMeta } from '../types'
export function Toc({ steps, index, go }: { steps: readonly StepMeta[]; index: number; go: (n: number) => void }) {
  const [wide, setWide] = useState(() => window.innerWidth >= 1200)
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1200)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!wide) return null
  const eras = steps.flatMap((step, i) => steps.findIndex(s => s.era === step.era) === i ? [{ era: step.era, index: i }] : [])
  return <nav data-presentation-toc="" aria-label="Sections">{eras.map(item => <button key={item.era} data-presentation-toc-entry={item.era} data-presentation-active={steps[index].era === item.era ? 'true' : 'false'} aria-current={steps[index].era === item.era ? 'step' : undefined} onClick={() => go(item.index)}>{item.era}</button>)}</nav>
}
