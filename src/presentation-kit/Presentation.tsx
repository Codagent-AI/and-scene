import type { PresentationProps } from './types'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Stage } from './Stage'
import { clampStep, usePresentationNav } from './usePresentationNav'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', brand, className, style }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const index = clampStep(nav.index, steps.length)
  const step = steps[index]
  const rootStyle = { display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', position: 'relative' as const, minHeight: '100vh', ...style }
  if (!step) return <main data-presentation-root data-presentation-empty data-presentation-mode={nav.mode} className={className} style={rootStyle}>
    <header data-presentation-header><h1>{title}</h1></header>
    <div role="status" data-presentation-empty-state>No steps available.</div>
    <button type="button" data-presentation-mode-toggle aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggleMode}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
  return <main data-presentation-root data-presentation-mode={nav.mode} className={className} style={rootStyle}>
    <Header title={title} mode={nav.mode} step={step} brand={brand} />
    <Stage<TPayload> step={step} index={index} mode={nav.mode} onNext={nav.next} onPrev={nav.prev} />
    <Footer<TPayload> steps={steps} index={index} mode={nav.mode} onSelect={nav.goTo} onPrev={nav.prev} onNext={nav.next} />
    <button type="button" data-presentation-mode-toggle aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggleMode}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
