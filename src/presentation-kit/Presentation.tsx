import { Header } from './chrome/Header.js'
import { Footer } from './chrome/Footer.js'
import { Toc } from './chrome/Toc.js'
import { Attribution } from './chrome/Attribution.js'
import { Stage } from './Stage.js'
import { usePresentationNav } from './usePresentationNav.js'
import type { PresentationProps } from './types.js'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', designSize, branding, attribution, className, style }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (!steps.length) return null
  return <main className={['presentation', `presentation-${nav.mode}`, className].filter(Boolean).join(' ')} style={style} data-presentation-root="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}>
    <Header title={title} mode={nav.mode} branding={branding} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} width={designSize?.width} height={designSize?.height} onTouchStart={nav.touchStart} onTouchEnd={nav.touchEnd} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} onGoTo={nav.goTo} onPrev={nav.prev} onNext={nav.next} />
    {attribution === false ? null : attribution ?? <Attribution />}
    <button type="button" className="presentation-mode-toggle" aria-label={nav.mode === 'browse' ? 'Switch to present mode' : 'Switch to browse mode'} onClick={nav.toggleMode} data-presentation-mode-toggle="">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
