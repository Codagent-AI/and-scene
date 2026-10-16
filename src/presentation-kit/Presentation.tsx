import type { ReactNode } from 'react'
import { DEFAULT_ATTRIBUTION, DESIGN_H, DESIGN_W, WIDE_VIEWPORT } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import { useFitScale } from './useFitScale'
import type { AnyStep, PresentationMode } from './types'

export interface AttributionOptions {
  label?: string
  href?: string
}

export interface PresentationProps {
  steps: readonly AnyStep[]
  title: string
  initialMode?: PresentationMode
  /** `false` removes the attribution; an object overrides label/href. */
  attribution?: false | AttributionOptions
  /** Host-provided header brand (top-left). Nothing is rendered by default. */
  brand?: ReactNode
  designWidth?: number
  designHeight?: number
}

export function Presentation({
  steps,
  title,
  initialMode = 'present',
  attribution,
  brand,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
}: PresentationProps) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { scale, viewportW } = useFitScale(nav.mode, designWidth, designHeight)
  if (steps.length === 0) return null
  const step = steps[nav.index]
  const attr = attribution === false ? null : { ...DEFAULT_ATTRIBUTION, ...attribution }
  return (
    <div
      data-presentation-chrome=""
      data-presentation-mode={nav.mode}
      data-presentation-name={title}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header step={step} mode={nav.mode} brand={brand} />
      <Stage
        step={step}
        stepIndex={nav.index}
        mode={nav.mode}
        scale={scale}
        viewportW={viewportW}
        designW={designWidth}
        designH={designHeight}
      />
      {nav.mode === 'browse' && viewportW >= WIDE_VIEWPORT && (
        <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />
      )}
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attr && (
        <a
          data-presentation-attribution=""
          href={attr.href}
          target="_blank"
          rel="noreferrer"
          style={{ position: 'absolute', right: 0, bottom: 0 }}
        >
          {attr.label}
        </a>
      )}
    </div>
  )
}
