import { useEffect, useRef, useState } from 'react'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand }: { steps: Step<T>[]; title: string; initialMode?: Mode; brand?: React.ReactNode }) {
  const nav = usePresentationNav(steps.length, initialMode)
  const start = useRef(0)
  const [wide, setWide] = useState(() => window.innerWidth > 700)
  useEffect(() => { const resize = () => setWide(window.innerWidth > 700); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [])
  const step = steps[nav.index]
  const eras = steps.flatMap((s, i) => steps.findIndex(x => x.era === s.era) === i ? [{ name: s.era, index: i }] : [])
  if (!step) return null
  return <main data-presentation data-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-step-era={step.era} onTouchStart={e => { start.current = e.touches[0].clientX }} onTouchEnd={e => { const dx = e.changedTouches[0].clientX - start.current; if (dx < -50) nav.next(); else if (dx > 50) nav.prev() }}>
    <header data-presentation-header>{brand}<span data-presentation-marker>{String(nav.index + 1).padStart(2, '0')}</span><span data-presentation-header-title style={nav.mode === 'present' ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : undefined}>{nav.mode === 'browse' ? title : step.title}</span><button data-presentation-mode onClick={nav.toggle} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button></header>
    {nav.mode === 'browse' && <nav data-presentation-toc hidden={!wide} aria-label="Sections">{eras.map(era => <button key={era.name} data-presentation-toc-item data-active={era.name === step.era} aria-current={era.name === step.era ? 'step' : undefined} onClick={() => nav.go(era.index)}>{era.name}</button>)}</nav>}
    <Stage step={step} mode={nav.mode} />
    {nav.mode === 'browse' && <footer data-presentation-footer><div><h1>{step.title}</h1><p>{step.caption}</p></div><div data-presentation-controls><button onClick={nav.prev} disabled={nav.index === 0}>Previous</button><div data-presentation-progress>{steps.map((s, i) => <button key={s.id} data-presentation-progress-item data-active={i === nav.index} aria-current={i === nav.index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => nav.go(i)} />)}</div><button onClick={nav.next} disabled={nav.index === steps.length - 1}>Next</button></div></footer>}
    <a data-presentation-attribution href="https://github.com/Codagent-AI/and-scene" style={{ position: 'fixed', right: 12, bottom: 8 }}>made by and-scene</a>
  </main>
}
