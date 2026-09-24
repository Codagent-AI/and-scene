import { useEffect, useState } from 'react'
import type { Step } from '../types'
export function Toc<T>({ steps, index, onSelect }: { steps: readonly Step<T>[]; index: number; onSelect: (index: number) => void }) {
  const sections = [...new Set(steps.map((step) => step.section))]
  const [isWide, setIsWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= 960)
  useEffect(() => {
    const update = () => setIsWide(window.innerWidth >= 960)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  if (!isWide) return null
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc style={{ position: 'absolute', top: 64, right: 16, zIndex: 2, display: 'grid', gap: 8 }}>
    {sections.map((section) => { const position = steps.findIndex((step) => step.section === section); return <button key={section} type="button" aria-current={steps[index]?.section === section ? 'location' : undefined} data-presentation-toc-item data-presentation-active={steps[index]?.section === section ? 'true' : 'false'} onClick={() => onSelect(position)}>{section}</button> })}
  </nav>
}
