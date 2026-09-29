import { usePresentationNav } from './usePresentationNav'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, designSize }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (!steps.length) return null
  const activeStep = steps[nav.index]
  return <main className="presentation" data-presentation="" data-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}>
    <Header title={title} mode={nav.mode} brand={brand} />
    <Stage steps={steps} index={nav.index} mode={nav.mode} width={designSize?.width} height={designSize?.height} touchHandlers={nav.touchHandlers} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} onJump={nav.go} />}
    <Footer step={activeStep} index={nav.index} steps={steps} mode={nav.mode} onPrevious={nav.prev} onNext={nav.next} onJump={nav.go} />
    <button className="presentation-mode-toggle" type="button" onClick={nav.toggleMode} aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} data-presentation-mode-toggle="">{nav.mode === 'browse' ? 'Present mode' : 'Browse mode'}</button>
    {attribution !== false && <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" target="_blank" rel="noreferrer">{attribution ?? 'made by and-scene'}</a>}
  </main>
}
