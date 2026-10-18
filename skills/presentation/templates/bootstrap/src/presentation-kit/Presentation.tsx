import type { CSSProperties, ReactNode } from 'react'
import { DESIGN_H, DESIGN_W, type Mode } from './constants'
import { Attribution, type AttributionOptions } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Step } from './types'
import { isTocVisible, useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { useViewportSize } from './useViewport'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: ReactNode
  /** Pass `false` to drop the default "made by and-scene" attribution. */
  attribution?: AttributionOptions | false
  designWidth?: number
  designHeight?: number
  className?: string
  style?: CSSProperties
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
  className,
  style,
}: PresentationProps<TPayload>) {
  const { index, mode, goTo, next, prev } = usePresentationNav(steps.length, { initialMode })
  const scale = useFitScale(mode, designWidth, designHeight)
  const { width } = useViewportSize()
  const step = steps[index]
  if (!step) return null
  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={mode}
      data-presentation-step-index={index}
      data-presentation-step-count={steps.length}
      data-step-index={index}
      data-step-count={steps.length}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Header mode={mode} step={step} index={index} count={steps.length} brand={brand} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {isTocVisible(mode, width) && <Toc steps={steps} index={index} onGoTo={goTo} />}
        <Stage
          steps={steps}
          index={index}
          mode={mode}
          scale={scale}
          designWidth={designWidth}
          designHeight={designHeight}
        />
      </div>
      <Footer mode={mode} steps={steps} index={index} onGoTo={goTo} onPrev={prev} onNext={next} />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
