import type { ReactNode } from 'react'
import { STAGE_LAYOUT, type PresentationMode } from './constants'
import { tocVisible } from './fitScale'
import { Attribution, type AttributionOptions } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  className?: string
  /** Host-provided top-left branding; none by default. */
  brand?: ReactNode
  /** Override the default attribution, or pass false to omit it. */
  attribution?: AttributionOptions | false
  designWidth?: number
  designHeight?: number
}

/** Composes stage, chrome and navigation for an ordered list of steps. */
export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  className,
  brand,
  attribution,
  designWidth,
  designHeight,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { mode, index } = nav
  const { viewport, scale } = useFitScale(mode, designWidth, designHeight)
  const step = steps[index]
  if (!step) return null
  const layout = STAGE_LAYOUT[mode]
  const showToc = tocVisible(mode, viewport.width)

  return (
    <div
      role="region"
      aria-label={title}
      className={className}
      data-presentation-root=""
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      data-step-id={step.id}
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <Header
        mode={mode}
        index={index}
        era={step.era}
        title={step.title}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      {showToc ? <Toc steps={steps} index={index} onGoTo={nav.goTo} /> : null}
      <div
        data-presentation-stage-region=""
        style={{
          position: 'absolute',
          top: layout.top,
          bottom: layout.bottom,
          left: layout.side + (showToc ? layout.toc : 0),
          right: layout.side,
        }}
      >
        <Stage
          key={mode}
          step={step}
          index={index}
          scale={scale}
          designWidth={designWidth}
          designHeight={designHeight}
        />
      </div>
      <Footer
        mode={mode}
        steps={steps}
        index={index}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
