import { useEffect, useState } from 'react'
import type { StepMeta } from '../types'
export function eraEntries(steps: readonly StepMeta[]) {
  return steps.flatMap((step, index) => steps.findIndex(s => s.era === step.era) === index ? [{ era: step.era, index }] : [])
}
export function Toc({ steps, index, jump }: { steps: readonly StepMeta[]; index: number; jump: (index: number) => void }) {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1100px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1100px)')
    const change = () => setWide(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  if (!wide) return null
  return <nav data-presentation-toc="" aria-label="Sections" style={{ position: 'absolute', left: 0, top: 150 }}>
    {eraEntries(steps).map(entry => <button key={entry.era} data-presentation-toc-item="" data-presentation-active={steps[index].era === entry.era ? 'true' : 'false'} aria-current={steps[index].era === entry.era ? 'step' : undefined} onClick={() => jump(entry.index)}>{entry.era}</button>)}
  </nav>
}
