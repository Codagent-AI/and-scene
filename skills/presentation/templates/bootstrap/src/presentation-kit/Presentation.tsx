import { useEffect } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { SceneDefinition } from './types'
import { usePresentationNav } from './usePresentationNav'
export function Presentation<T>({ steps, title, initialMode = 'browse', designSize }: SceneDefinition<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { toggleMode } = nav
  useEffect(() => { const toggle = () => toggleMode(); window.addEventListener('presentation:toggle', toggle); return () => window.removeEventListener('presentation:toggle', toggle) }, [toggleMode])
  const step = steps[nav.index]
  return <main className={`presentation presentation-${nav.mode}`} data-presentation-root data-step-count={steps.length} data-step-index={nav.index} onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX) }} onTouchEnd={(e) => { const x = Number((e.currentTarget as HTMLElement).dataset.touchX); const dx = e.changedTouches[0].clientX - x; if (Math.abs(dx) > 55) { if (dx < 0) nav.next(); else nav.prev() } }}><Header title={title} mode={nav.mode} index={nav.index} total={steps.length} /><button className="presentation-mode" type="button" onClick={nav.toggleMode} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present' : 'Browse'} <kbd>P</kbd></button>{nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}<Stage steps={steps} index={nav.index} mode={nav.mode} width={designSize?.width} height={designSize?.height} /><Footer step={step} title={title} mode={nav.mode} steps={steps} index={nav.index} goTo={nav.goTo} prev={nav.prev} next={nav.next} /></main>
}
