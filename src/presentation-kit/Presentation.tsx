import type { ReactNode } from 'react'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import { useWideViewport } from './useWideViewport'
import type { Mode, Step } from './types'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host-supplied branding for the top-left header slot. */
  brand?: ReactNode
  canvasWidth?: number
  canvasHeight?: number
}

/** Composes the stage, navigation, and chrome for one evolving scene. */
export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  canvasWidth,
  canvasHeight,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  const step = steps[nav.index]
  if (!step) return null
  return (
    <section
      aria-label={title}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-presentation-era={step.era}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0 }}
    >
      <Header mode={nav.mode} deckTitle={title} brand={brand} />
      <div style={{ display: 'flex', flex: '1 1 auto', minHeight: 0 }}>
        {nav.mode === 'browse' && wide ? <Toc steps={steps} activeIndex={nav.index} onJump={nav.go} /> : null}
        <Stage step={step} mode={nav.mode} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
      </div>
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        last={nav.last}
        onJump={nav.go}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      <Attribution />
    </section>
  )
}
