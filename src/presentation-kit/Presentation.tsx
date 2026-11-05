import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { Mode } from './usePresentationNav'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand }: { steps: Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode }) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode)
  const step = steps[nav.index]
  if (!step) return null
  const Scene = step.Scene
  const eras = steps.map((s, i) => ({ era: s.era, index: i })).filter((s, i, a) => a.findIndex(x => x.era === s.era) === i)
  return <main data-presentation data-step-count={steps.length} data-step-index={nav.index} data-presentation-mode={nav.mode} {...nav.touch}>
    <header data-presentation-header>{brand}<span data-presentation-marker>{String(nav.index + 1).padStart(2, '0')}</span>{nav.mode === 'browse' && <span>{title}</span>}<button data-presentation-mode-toggle onClick={nav.toggle} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button></header>
    <div data-presentation-stage style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, position: 'relative', margin: 'auto' }}><div style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative' }}><LayoutGroup><AnimatePresence initial={false}><motion.div key={step.groupKey ?? step.id} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Scene payload={step.payload}/></motion.div></AnimatePresence></LayoutGroup></div></div>
    <footer data-presentation-footer><h1>{step.title}</h1>{nav.mode === 'browse' && <><p data-presentation-caption>{step.caption}</p><nav data-presentation-progress aria-label="Steps">{steps.map((s, i) => <button key={s.id} data-presentation-active={i === nav.index ? 'true' : 'false'} aria-current={i === nav.index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => nav.jump(i)} />)}</nav><div data-presentation-controls><button onClick={nav.prev} disabled={nav.index === 0}>Previous</button><button onClick={nav.next} disabled={nav.index === steps.length - 1}>Next</button></div></>}</footer>
    {nav.mode === 'browse' && <nav data-presentation-toc aria-label="Sections">{eras.map(({ era, index }) => <button key={era} data-presentation-active={step.era === era ? 'true' : 'false'} aria-current={step.era === era ? 'step' : undefined} onClick={() => nav.jump(index)}>{era}</button>)}</nav>}
    <a data-presentation-attribution href="https://github.com/Codagent-AI/and-scene" style={{ position: 'fixed', right: 12, bottom: 8 }}>made by and-scene</a>
  </main>
}
