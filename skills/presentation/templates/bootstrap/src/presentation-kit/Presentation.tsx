import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', className, renderBrand, attribution, designSize }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  const byline = attribution ?? <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>
  if (!step) return null

  return <main
    className={['presentation', className].filter(Boolean).join(' ')}
    data-presentation=""
    data-presentation-mode={nav.mode}
    data-step-count={steps.length}
    data-step-index={nav.index}
    {...nav.touchHandlers}
  >
    <Header title={title} mode={nav.mode} step={step} index={nav.index} count={steps.length} brand={renderBrand} toggleMode={nav.toggleMode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} designWidth={designSize?.width} designHeight={designSize?.height} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} goTo={nav.goTo} next={nav.next} prev={nav.prev} title={title} attribution={byline} />
  </main>
}

export default Presentation
