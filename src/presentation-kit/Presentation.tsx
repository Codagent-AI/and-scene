import { Footer, Header, Toc } from './chrome'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', className, showToc = true, attribution }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  if (!step) return null
  return <main className={className} data-presentation="true" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} {...nav.touchHandlers}>
    <Header mode={nav.mode} title={title} step={step} />
    {nav.mode === 'browse' && showToc ? <Toc steps={steps} activeIndex={nav.index} onSelect={nav.goTo} /> : null}
    <Stage step={step} mode={nav.mode} stepIndex={nav.index} />
    <Footer mode={nav.mode} title={title} step={step} steps={steps} index={nav.index} onSelect={nav.goTo} onPrevious={nav.previous} onNext={nav.next} attribution={attribution} />
    <button type="button" data-presentation-mode-toggle="true" onClick={nav.toggleMode} aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
