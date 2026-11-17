import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution = true }: { steps: Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: boolean }) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode)
  const step = steps[nav.index]
  if (!step) return null
  const Scene = step.Scene
  const eras = steps.map((s, i) => ({ era: s.era, index: i })).filter((s, i, all) => all.findIndex(x => x.era === s.era) === i)
  return <main data-presentation-root data-step-count={steps.length} data-step-index={nav.index} data-presentation-mode={nav.mode} {...{ onTouchStart: nav.onTouchStart, onTouchEnd: nav.onTouchEnd }}>
    <header data-presentation-header><div>{brand}</div><span data-presentation-marker>{String(nav.index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span><button data-presentation-mode-toggle onClick={nav.toggle}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button></header>
    {nav.mode === 'browse' && <aside data-presentation-toc aria-label="Sections">{eras.map(({era, index}) => <button key={era} data-presentation-active={step.era === era} aria-current={step.era === era ? 'step' : undefined} onClick={() => nav.jump(index)}>{era}</button>)}</aside>}
    <section data-presentation-stage style={{width: DESIGN_W * scale, height: DESIGN_H * scale, position: 'relative', margin: 'auto'}}><div style={{width: DESIGN_W, height: DESIGN_H, position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'top left'}}><LayoutGroup><AnimatePresence mode="sync"><motion.div key={step.groupKey ?? step.id} data-presentation-scene style={{position: 'absolute', inset: 0}} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}><Scene payload={step.payload} /></motion.div></AnimatePresence></LayoutGroup></div></section>
    <footer data-presentation-footer><div><small>{nav.mode === 'browse' ? title : step.era}</small><h1>{step.title}</h1>{nav.mode === 'browse' && <p>{step.caption}</p>}</div>{nav.mode === 'browse' && <nav data-presentation-navigation aria-label="Steps"><button onClick={nav.prev} disabled={nav.index === 0} aria-label="Previous step">←</button>{steps.map((s, i) => <button key={s.id} aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === nav.index ? 'step' : undefined} data-presentation-active={i === nav.index} onClick={() => nav.jump(i)}>●</button>)}<button onClick={nav.next} disabled={nav.index === steps.length - 1} aria-label="Next step">→</button></nav>}</footer>
    {attribution && <a data-presentation-attribution style={{position:'absolute', right: 16, bottom: 12}} href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}
  </main>
}
