import type { PresentationProps } from './types'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', brand, className, style }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  if (!step) return null
  return <main data-presentation-root data-presentation-mode={nav.mode} className={className} style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', position: 'relative', minHeight: '100vh', ...style }}>
    <Header title={title} mode={nav.mode} step={step} brand={brand} />
    <Stage<TPayload> step={step} index={nav.index} mode={nav.mode} onNext={nav.next} onPrev={nav.prev} />
    <Footer<TPayload> steps={steps} index={nav.index} mode={nav.mode} onSelect={nav.goTo} onPrev={nav.prev} onNext={nav.next} />
    <button type="button" data-presentation-mode-toggle aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggleMode}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
