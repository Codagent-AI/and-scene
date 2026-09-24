import { Stage } from './Stage'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationMode, Step } from './types'

export interface PresentationProps<T> { steps: Step<T>[]; title: string; initialMode?: PresentationMode; attribution?: false | { label?: string; href?: string }; brand?: React.ReactNode }
export function Presentation<T>({ steps, title, initialMode = 'browse', attribution, brand }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (!steps.length) return null
  const step = steps[nav.index]
  return <main className={`presentation presentation-${nav.mode}`} data-presentation="" data-presentation-mode={nav.mode} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <Header title={title} mode={nav.mode} step={step} index={nav.index} brand={brand} onToggle={nav.toggleMode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} onSelect={nav.goTo} />}
    <Stage steps={steps} step={step} index={nav.index} mode={nav.mode} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} title={title} onSelect={nav.goTo} onNext={nav.next} onPrev={nav.prev} attribution={attribution} />
  </main>
}
