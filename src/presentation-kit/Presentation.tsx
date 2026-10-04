import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { DESIGN_H, DESIGN_W } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

// A pointer click leaves focus on a chrome button, which would keep it from handing keys to the deck; keyboard activations (detail 0) keep focus.
// Buttons inside the stage belong to the presentation and keep their focus.
function releasePointerFocus(event: React.MouseEvent) {
  if (event.detail === 0 || !(event.target instanceof HTMLElement)) return
  const button = event.target.closest('button')
  if (button && !button.closest('[data-presentation-stage]')) button.blur()
}

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', designSize, attribution = {} }: PresentationProps<TPayload>) {
  const width = designSize?.width ?? DESIGN_W
  const height = designSize?.height ?? DESIGN_H
  const nav = usePresentationNav(steps.length, initialMode)
  if (steps.length === 0) return null
  const index = Math.min(nav.index, steps.length - 1)
  const step = steps[index]
  const eras = [...new Set(steps.map((item) => item.era))]
  return <main className="presentation" data-presentation="" data-mode={nav.mode} {...nav.touchHandlers} onClick={releasePointerFocus}>
    <Header title={title} step={step} index={index} mode={nav.mode} onToggleMode={nav.toggleMode} />
    <Stage step={step} index={index} mode={nav.mode} designWidth={width} designHeight={height} />
    <Toc eras={eras} steps={steps} index={index} mode={nav.mode} onSelect={nav.goTo} />
    <Footer title={title} step={step} steps={steps} index={index} mode={nav.mode} onSelect={nav.goTo} onNext={nav.next} onPrev={nav.prev} />
    {attribution !== false && <a className="presentation-attribution" data-presentation-attribution="" href={attribution.href ?? 'https://github.com/Codagent-AI/and-scene'} target="_blank" rel="noreferrer">{attribution.label ?? 'made by and-scene'}</a>}
  </main>
}
