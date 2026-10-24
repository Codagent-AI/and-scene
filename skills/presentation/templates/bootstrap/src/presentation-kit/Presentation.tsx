import { useEffect, type ReactNode } from 'react'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { DESIGN_H, DESIGN_W, WIDE_VIEWPORT_MIN } from './constants'
import { Stage } from './Stage'
import type { AttributionOption, Canvas, Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useViewport'

const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

export interface PresentationProps<P> {
  steps: readonly Step<P>[]
  /** Presentation title; becomes the document title. */
  title: string
  initialMode?: Mode
  initialIndex?: number
  canvas?: Canvas
  /** Default attribution link; pass `false` to hide it or an object to override it. */
  attribution?: AttributionOption
  /** Optional host branding for the top-left header slot. */
  brand?: ReactNode
  className?: string
}

export function Presentation<P>({
  steps,
  title,
  initialMode,
  initialIndex,
  canvas = DEFAULT_CANVAS,
  attribution,
  brand,
  className,
}: PresentationProps<P>) {
  const nav = usePresentationNav({ count: steps.length, initialMode, initialIndex })
  const viewport = useViewport()
  useEffect(() => {
    document.title = title
  }, [title])

  const step = steps[nav.index]
  const browse = nav.mode === 'browse'
  return (
    <div
      className={className}
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header mode={nav.mode} index={nav.index} step={step} brand={brand} />
      {browse && viewport.width >= WIDE_VIEWPORT_MIN && <Toc steps={steps} index={nav.index} onJump={nav.goTo} />}
      <Stage step={step} index={nav.index} mode={nav.mode} canvas={canvas} />
      <Footer mode={nav.mode} steps={steps} index={nav.index} onJump={nav.goTo} onPrev={nav.prev} onNext={nav.next} />
      <Attribution option={attribution} />
    </div>
  )
}
