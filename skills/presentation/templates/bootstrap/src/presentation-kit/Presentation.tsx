import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { usePresentationNav } from './usePresentationNav'
import type { Attribution, PresentationMode, Step } from './types'

const DEFAULT_ATTRIBUTION: Attribution = { href: 'https://github.com/and-scene/and-scene', label: 'made by and-scene' }
export function Presentation<T>({ steps, title, initialMode = 'browse', attribution = DEFAULT_ATTRIBUTION, brand }: { steps: readonly Step<T>[]; title: string; initialMode?: PresentationMode; attribution?: Attribution | false; brand?: React.ReactNode }) {
  const nav = usePresentationNav(steps.length, initialMode)
  return <main data-presentation-chrome data-step-count={steps.length} data-step-index={nav.index} data-presentation-mode={nav.mode} style={{ position: 'fixed', inset: 0, overflow: 'hidden' }} onTouchStart={nav.touchStart} onTouchEnd={nav.touchEnd}>
    <Header title={title} stepTitle={steps[nav.index]?.title} mode={nav.mode} index={nav.index} total={steps.length} brand={brand} />
    <Stage steps={steps} index={nav.index} mode={nav.mode} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} goTo={nav.goTo} next={nav.next} prev={nav.prev} attribution={attribution} />
    <button type="button" data-presentation-mode-toggle aria-label="Toggle presentation mode" onClick={nav.toggleMode}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
