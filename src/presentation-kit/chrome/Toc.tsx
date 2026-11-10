import { useEffect, useState } from 'react'
import type { StepMeta } from '../types'
export function Toc({ steps, index, jump }: { steps: StepMeta[]; index: number; jump: (index: number) => void }) {
  const [wide, setWide] = useState(() => window.innerWidth >= 1100)
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1100)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!wide) return null
  const eras = steps.flatMap((step, i) => steps.findIndex(other => other.era === step.era) === i ? [{ era: step.era, i }] : [])
  return <nav style={{ position: 'absolute', left: 0, top: 100 }} data-presentation-toc="" aria-label="Sections">{eras.map(({ era, i }) => {
    const active = steps[index].era === era
    return <button key={era} data-presentation-active={active} aria-current={active ? 'step' : undefined} onClick={() => jump(i)}>{era}</button>
  })}</nav>
}
