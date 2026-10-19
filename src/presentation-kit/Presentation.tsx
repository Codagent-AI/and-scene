import type { CSSProperties, ReactNode } from 'react'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { WIDE_VIEWPORT } from './constants'
import { Stage } from './Stage'
import type { AttributionOptions, PresentationMode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { useViewportSize } from './useViewportSize'

export interface PresentationProps<TPayload> {
  steps: ReadonlyArray<Step<TPayload>>
  title: string
  initialMode?: PresentationMode
  /** Optional host branding for the top-left header slot. */
  brand?: ReactNode
  /** Override the default attribution link, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  /** Scoping class for presentation-owned CSS, placed on the chrome root. */
  className?: string
  style?: CSSProperties
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  className,
  style,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { width } = useViewportSize()
  const step = steps[nav.index]
  const showToc = nav.mode === 'browse' && width >= WIDE_VIEWPORT

  return (
    <div
      data-presentation-root=""
      className={className}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-presentation-step-id={step.id}
      data-presentation-step-era={step.era}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', ...style }}
    >
      <Header
        mode={nav.mode}
        title={title}
        index={nav.index}
        count={steps.length}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      {showToc ? <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} /> : null}
      <Stage step={step} mode={nav.mode} />
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        onPrev={nav.prev}
        onNext={nav.next}
        onGoTo={nav.goTo}
      />
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
