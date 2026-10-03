import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', className, style }: PresentationProps<TPayload>) {
  const hostRef = useRef<HTMLElement>(null)
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  if (!step) return null
  return (
    <main ref={hostRef} className={`presentation ${className ?? ''}`.trim()} data-presentation data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={style as CSSProperties} {...nav.touchHandlers}>
      <Header title={title} mode={nav.mode} step={step} onToggleMode={nav.toggleMode} />
      <div className="presentation__body">
        {nav.mode === 'browse' && <Toc steps={steps} activeIndex={nav.index} onSelect={nav.goTo} />}
        <Stage step={step} mode={nav.mode} hostRef={hostRef} />
      </div>
      <Footer title={title} mode={nav.mode} step={step} steps={steps} activeIndex={nav.index} onSelect={nav.goTo} onNext={nav.next} onPrev={nav.prev} />
      <a className="presentation__attribution" data-presentation-attribution href="https://github.com/openai/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>
    </main>
  )
}
