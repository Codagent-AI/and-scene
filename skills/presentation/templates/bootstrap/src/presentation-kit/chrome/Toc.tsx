import { useEffect, useState } from 'react'
import type { Step, PresentationMode } from '../types'
export function Toc<T>({ eras, steps, index, mode, onSelect }: { eras: string[]; steps: readonly Step<T>[]; index: number; mode: PresentationMode; onSelect: (index: number) => void }) {
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= 900)
  useEffect(() => { const update = () => setWide(window.innerWidth >= 900); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update) }, [])
  if (mode !== 'browse' || !wide) return null
  return <nav className="presentation-toc" data-presentation-toc="" aria-label="Sections">{eras.map((era) => { const itemIndex = steps.findIndex((step) => step.era === era); const active = steps[index]?.era === era; return <button type="button" key={era} className="presentation-toc-item" data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'location' : undefined} onClick={() => onSelect(itemIndex)}>{era}</button> })}</nav>
}
