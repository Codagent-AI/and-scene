import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', brand, designSize }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  if (!step) return null
  return <main data-presentation-chrome="" data-presentation-step-count={steps.length} data-presentation-step-index={nav.index} data-presentation-mode={nav.mode} {...nav.touchHandlers} style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} onToggleMode={nav.toggleMode} />
    <Stage step={step} index={nav.index} mode={nav.mode} designSize={designSize} />
    <Footer steps={steps} index={nav.index} jumpTo={nav.jumpTo} next={nav.next} prev={nav.prev} mode={nav.mode} />
  </main>
}
