import { validateSteps } from './validateSteps'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, className }: PresentationProps<T>) {
  validateSteps(steps)
  const nav = usePresentationNav(steps.length, initialMode)
  return <main className={className} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} aria-label={title} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} toggle={nav.toggle} />
    <Stage step={steps[nav.index]} mode={nav.mode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} next={nav.next} prev={nav.prev} />
  </main>
}
