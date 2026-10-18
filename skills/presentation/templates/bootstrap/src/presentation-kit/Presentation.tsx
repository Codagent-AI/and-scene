import type { ReactNode } from 'react'
import { Attribution, type AttributionOptions } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { WIDE_BREAKPOINT, type Mode } from './constants'
import { Stage } from './Stage'
import { deriveEras } from './steps'
import type { AnyStep } from './types'
import { useViewport } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps {
  steps: readonly AnyStep[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left branding; none by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  className?: string
}

/** One scene moving through named steps, with present/browse chrome and navigation. */
export function Presentation({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  className,
}: PresentationProps) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { width } = useViewport()
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
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <Header step={step} index={nav.index} mode={nav.mode} brand={brand} onToggleMode={nav.toggleMode} />
      <Stage step={step} mode={nav.mode} />
      {browse && (
        <Footer
          steps={steps}
          index={nav.index}
          eras={deriveEras(steps)}
          showToc={width >= WIDE_BREAKPOINT}
          onPrev={nav.prev}
          onNext={nav.next}
          onJump={nav.goTo}
        />
      )}
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
