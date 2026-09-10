import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse' }: PresentationProps<TPayload>) {
  if (steps.length === 0) throw new Error('A presentation needs at least one step.')
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  return <main className="presentation" aria-label={title} data-presentation data-presentation-mode={nav.mode}>
    <div data-testid="presentation-chrome" data-presentation-chrome data-step-count={steps.length} data-step-index={nav.index} data-presentation-mode={nav.mode} style={{ display: 'grid', gridTemplateRows: 'auto auto minmax(0, 1fr) auto', minHeight: '100vh' }}>
      <Header step={step} mode={nav.mode} onToggleMode={nav.toggleMode} />
      {nav.mode === 'browse' ? <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} /> : null}
      <Stage step={step} index={nav.index} mode={nav.mode} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} />
      {nav.mode === 'browse' ? <Footer steps={steps} index={nav.index} onGoTo={nav.goTo} onNext={nav.next} onPrev={nav.prev} /> : null}
    </div>
    <a href={ATTRIBUTION_URL} data-presentation-attribution>made by and-scene</a>
  </main>
}
