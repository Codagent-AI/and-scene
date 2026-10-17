import type { CSSProperties, ReactNode } from 'react'
import { DEFAULT_ATTRIBUTION } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { buildSections } from './navigation'
import { Stage } from './Stage'
import type { Canvas, Mode, SceneStep } from './types'
import { usePresentationNav } from './usePresentationNav'
import { useWideViewport } from './useWideViewport'

export interface AttributionConfig {
  label: string
  href: string
}

export interface PresentationProps {
  steps: readonly SceneStep[]
  title: string
  initialMode?: Mode
  /** Optional host branding for the header's top-left slot; none by default. */
  brand?: ReactNode
  /** Override the default attribution link, or pass `false` to omit it. */
  attribution?: AttributionConfig | false
  /** Override the 880 x 380 design canvas. */
  canvas?: Canvas
  className?: string
  style?: CSSProperties
}

export function Presentation({
  steps,
  title,
  initialMode = 'present',
  brand,
  attribution = DEFAULT_ATTRIBUTION,
  canvas,
  className,
  style,
}: PresentationProps) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  const step = steps[nav.index]
  if (!step) return null
  const showToc = nav.mode === 'browse' && wide
  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={step.id}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Header step={step} index={nav.index} count={steps.length} mode={nav.mode} brand={brand} />
      <div data-presentation-body="" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {showToc ? (
          <Toc sections={buildSections(steps)} index={nav.index} onGoTo={nav.goTo} />
        ) : null}
        <Stage step={step} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution ? (
        <a
          data-presentation-attribution=""
          href={attribution.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ position: 'absolute', right: 0, bottom: 0 }}
        >
          {attribution.label}
        </a>
      ) : null}
    </div>
  )
}
