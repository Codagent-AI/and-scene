import type { ReactNode } from 'react'
import { DEFAULT_CANVAS, TOC_MIN_WIDTH } from './constants'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { useMinWidth } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { AnyStep, AttributionOptions, CanvasSize, PresentationMode } from './types'

export interface PresentationProps {
  steps: readonly AnyStep[]
  title: string
  /** Mode the presentation opens in. */
  initialMode?: PresentationMode
  /** Host-provided header brand; nothing is rendered by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution link. */
  attribution?: AttributionOptions
  canvas?: CanvasSize
  className?: string
}

export function Presentation({
  steps,
  title,
  initialMode = 'present',
  brand,
  attribution,
  canvas = DEFAULT_CANVAS,
  className,
}: PresentationProps) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useMinWidth(TOC_MIN_WIDTH)
  const step = steps[nav.index]
  if (!step) return null

  return (
    <div
      className={className}
      role="region"
      aria-label={title}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: 0 }}
    >
      <Header
        step={step}
        index={nav.index}
        count={steps.length}
        mode={nav.mode}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      <div data-presentation-body="" style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
        {nav.mode === 'browse' && wide && (
          <Toc steps={steps} index={nav.index} onJump={nav.goTo} />
        )}
        <Stage step={step} index={nav.index} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      <Attribution {...attribution} />
    </div>
  )
}
