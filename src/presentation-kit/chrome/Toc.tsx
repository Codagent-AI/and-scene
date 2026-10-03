import type { Step } from '../types'
import { useEffect, useState } from 'react'
export function Toc<T>({ steps, index, onGoTo }: { steps: readonly Step<T>[]; index: number; onGoTo: (i: number) => void }) {
  const [wide, setWide] = useState(() => window.innerWidth >= 960)
  useEffect(() => { const update = () => setWide(window.innerWidth >= 960); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update) }, [])
  if (!wide) return null
  const sections = [...new Set(steps.map((step) => step.era))]
  return <nav className="presentation-toc" aria-label="Presentation contents" data-presentation-toc="">{sections.map((era) => { const first = steps.findIndex((step) => step.era === era); const active = steps[index].era === era; return <button type="button" key={era} onClick={() => onGoTo(first)} aria-current={active ? 'step' : undefined} data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'}>{era}</button> })}</nav>
}
