import type { CSSProperties, ReactNode } from 'react'
import { Attribution, type AttributionProps } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import type { Mode } from './constants'
import { Stage } from './Stage'
import type { Step } from './types'
import type { Canvas } from './useFitScale'
import { showsToc } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { useViewportSize } from './useViewportSize'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  canvas?: Canvas
  /** Host branding for the top-left slot; absent by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution, or pass false to omit it. */
  attribution?: false | AttributionProps
  className?: string
  style?: CSSProperties
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  canvas,
  brand,
  attribution,
  className,
  style,
}: PresentationProps<TPayload>) {
  const { index, mode, goTo, next, prev } = usePresentationNav(steps.length, initialMode)
  const { width } = useViewportSize()
  const step = steps[index]
  if (!step) return null
  return (
    <div
      data-presentation-root=""
      data-presentation-mode={mode}
      data-presentation-step-id={step.id}
      data-step-count={steps.length}
      data-step-index={index}
      aria-label={title}
      className={className}
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', ...style }}
    >
      <Header step={step} index={index} mode={mode} brand={brand} />
      {showsToc(mode, width) && <Toc steps={steps} index={index} onGoTo={goTo} />}
      <Stage steps={steps} index={index} mode={mode} canvas={canvas} />
      <Footer steps={steps} index={index} mode={mode} onGoTo={goTo} onPrev={prev} onNext={next} />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
