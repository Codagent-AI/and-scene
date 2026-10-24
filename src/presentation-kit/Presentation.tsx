import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from './constants'
import { Attribution } from './chrome/Attribution'
import type { AttributionOption } from './chrome/attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { tocVisible, useViewport } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { CanvasSize, PresentationMode, Step } from './types'

export interface PresentationProps<T> {
  steps: Step<T>[]
  title?: string
  initialMode?: PresentationMode
  canvas?: CanvasSize
  /** Host-provided header brand. Nothing is rendered when omitted. */
  brand?: ReactNode
  attribution?: AttributionOption
}

export function Presentation<T>({
  steps,
  title,
  initialMode = 'present',
  canvas,
  brand,
  attribution,
}: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { width: viewportWidth } = useViewport()
  const geometry = STAGE_LAYOUT[nav.mode]
  const showToc = tocVisible(nav.mode, viewportWidth)
  const tocWidth = showToc ? geometry.tocWidth : 0
  const step = steps[nav.index]

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={step.id}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header
        height={geometry.top}
        stepNumber={nav.index + 1}
        stepCount={steps.length}
        era={step.era}
        mode={nav.mode}
        onToggleMode={nav.toggleMode}
        brand={brand}
        title={title}
      />
      {showToc ? (
        <Toc
          steps={steps}
          index={nav.index}
          top={geometry.top}
          bottom={geometry.bottom}
          width={tocWidth}
          onJump={nav.goTo}
        />
      ) : null}
      <Stage
        step={step}
        stepIndex={nav.index}
        mode={nav.mode}
        canvas={canvas}
        inset={{
          top: geometry.top,
          bottom: geometry.bottom,
          left: tocWidth + geometry.side,
          right: geometry.side,
        }}
      />
      <Footer
        height={geometry.bottom}
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      <Attribution option={attribution} />
    </div>
  )
}
