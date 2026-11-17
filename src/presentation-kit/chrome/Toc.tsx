import { useEffect, useState } from 'react'
import type { StepMeta } from '../types'
export function eras(steps: StepMeta[]) {
  return steps.flatMap((step, index) => steps.findIndex(s => s.era === step.era) === index ? [{ era: step.era, index }] : [])
}
export function Toc({ steps, index, go }: { steps: StepMeta[]; index: number; go: (index: number) => void }) {
  const [wide, setWide] = useState(() => window.innerWidth >= 1000)
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1000)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!wide) return null
  return <nav data-presentation-toc="" aria-label="Sections">{eras(steps).map(section => {
    const active = steps[index].era === section.era
    return <button key={section.era} data-presentation-active={active} aria-current={active ? 'step' : undefined} onClick={() => go(section.index)}>{section.era}</button>
  })}</nav>
}
