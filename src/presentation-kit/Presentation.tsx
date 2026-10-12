import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'

const DEFAULT_ATTRIBUTION = { href: 'https://github.com/Codagent-AI/and-scene', label: 'made by and-scene' }

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', attribution = DEFAULT_ATTRIBUTION, brand }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (steps.length === 0) return null
  const step = steps[nav.index]
  const rootProps = {
    'data-step-count': steps.length,
    'data-step-index': nav.index,
    'data-presentation-mode': nav.mode,
  }
  return <main {...rootProps} {...nav.touchHandlers} style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage step={step} index={nav.index} mode={nav.mode} />
    <Footer step={step} index={nav.index} count={steps.length} mode={nav.mode} onPrev={nav.prev} onNext={nav.next} goTo={nav.goTo} />
    <button type="button" data-presentation-mode-toggle="true" aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggleMode}>Switch mode</button>
    <a data-presentation-attribution="true" href={attribution.href ?? DEFAULT_ATTRIBUTION.href} style={{ position: 'absolute', right: 16, bottom: 12 }}>{attribution.label ?? DEFAULT_ATTRIBUTION.label}</a>
  </main>
}
