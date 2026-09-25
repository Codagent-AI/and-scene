import { GITHUB_URL } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', attribution, brand, className }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  const attributionContent = attribution === undefined ? <a className="presentation-attribution" data-presentation-attribution="" href={GITHUB_URL} target="_blank" rel="noreferrer">made by and-scene</a> : attribution
  return <main className={['presentation', `presentation--${nav.mode}`, className].filter(Boolean).join(' ')} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}>
    <Header title={title} step={step} index={nav.index} total={steps.length} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} />
    <Footer title={title} step={step} steps={steps} index={nav.index} mode={nav.mode} goTo={nav.goTo} prev={nav.prev} next={nav.next} />
    {attributionContent && <div className="presentation__attribution-slot">{attributionContent}</div>}
  </main>
}

export type { PresentationProps, PresentationMode, SceneProps, Step, StepMeta } from './types'
