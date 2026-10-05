import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { DESIGN_H, DESIGN_W } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', designSize = { width: DESIGN_W, height: DESIGN_H }, attribution, className, style }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (steps.length === 0) return null
  const attributionOptions = { label: attribution?.label ?? 'made by and-scene', href: attribution?.href ?? 'https://github.com/and-scene', hidden: attribution?.hidden ?? false }
  return <main className={['presentation', `presentation--${nav.mode}`, className].filter(Boolean).join(' ')} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.stepIndex} style={style} {...nav.touchHandlers}>
    <Header title={title} mode={nav.mode} index={nav.stepIndex} />
    <Stage steps={steps} index={nav.stepIndex} mode={nav.mode} width={designSize.width} height={designSize.height} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.stepIndex} goTo={nav.goTo} />}
    <Footer steps={steps} index={nav.stepIndex} mode={nav.mode} title={title} goTo={nav.goTo} prev={nav.prev} next={nav.next} />
    <button type="button" className="presentation-mode-toggle" aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} aria-pressed={nav.mode === 'present'} data-presentation-mode-toggle="" onClick={() => nav.setMode(mode => mode === 'browse' ? 'present' : 'browse')}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    {!attributionOptions.hidden && <a className="presentation-attribution" data-presentation-attribution="" href={attributionOptions.href} style={{ position: 'fixed', right: 16, bottom: 12 }}>{attributionOptions.label}</a>}
  </main>
}
