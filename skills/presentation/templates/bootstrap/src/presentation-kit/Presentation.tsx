import type { PresentationProps, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', brand, attribution }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index] as Step<TPayload> | undefined
  if (!step) return null
  return <main className="presentation" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }} data-presentation="" data-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}
    onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage step={step} mode={nav.mode} />
    {nav.mode === 'browse' ? <Footer step={step} index={nav.index} count={steps.length} goTo={nav.goTo} prev={nav.prev} next={nav.next} attribution={attribution} /> : <div className="presentation-present-title" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }} data-presentation-present-title="">{step.title}</div>}
    <button type="button" style={{ position: 'absolute', top: 16, right: 16, zIndex: 5 }} className="presentation-mode-toggle" data-presentation-mode-toggle="" onClick={nav.toggleMode} aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
