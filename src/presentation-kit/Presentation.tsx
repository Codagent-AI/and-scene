import type { ReactNode } from 'react'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { DESIGN_H, DESIGN_W, WIDE_VIEWPORT } from './constants'
import { Stage } from './Stage'
import type { AttributionOptions, Canvas, Mode, Step } from './types'
import { useMediaQuery } from './useMediaQuery'
import { usePresentationNav } from './usePresentationNav'

const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  canvas?: Canvas
  /** Pass `false` to omit the default bottom-right attribution. */
  attribution?: false | AttributionOptions
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: ReactNode
}

export function Presentation<TPayload = undefined>({
  steps,
  title,
  initialMode = 'browse',
  canvas = DEFAULT_CANVAS,
  attribution = {},
  brand,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useMediaQuery(`(min-width: ${WIDE_VIEWPORT}px)`)
  const step = steps[nav.index]
  if (!step) return null

  return (
    <div
      data-presentation-root
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: 0 }}
    >
      <Header mode={nav.mode} index={nav.index} title={title} brand={brand} onToggleMode={nav.toggleMode} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {nav.mode === 'browse' && wide ? (
          <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />
        ) : null}
        <Stage step={step} index={nav.index} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
