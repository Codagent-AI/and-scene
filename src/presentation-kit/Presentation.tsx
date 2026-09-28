import type { ReactNode } from 'react'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { DESIGN_H, DESIGN_W, type PresentationMode } from './constants'
import { Stage } from './Stage'
import type { CanvasSize, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { useWideViewport } from './useWideViewport'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  /** Override the 880 × 380 design canvas. */
  canvas?: CanvasSize
  /** Host-provided top-left brand; none by default. */
  brand?: ReactNode
  /** Replace the default attribution, or pass `false` to omit it. */
  attribution?: ReactNode | false
}

const DEFAULT_CANVAS: CanvasSize = { width: DESIGN_W, height: DESIGN_H }

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'present',
  canvas = DEFAULT_CANVAS,
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  const step = steps[nav.index]
  if (!step) return null
  const browse = nav.mode === 'browse'

  return (
    <div
      className="presentation"
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      <Header
        mode={nav.mode}
        step={step}
        index={nav.index}
        count={steps.length}
        title={title}
        brand={brand}
      />
      <div
        className="presentation-body"
        data-presentation-body=""
        style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}
      >
        {browse && wide && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
        <Stage steps={steps} index={nav.index} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        caption={step.caption}
        title={step.title}
        onPrev={nav.prev}
        onNext={nav.next}
        onGoTo={nav.goTo}
      />
      {attribution === undefined ? <Attribution /> : attribution === false ? null : attribution}
    </div>
  )
}
