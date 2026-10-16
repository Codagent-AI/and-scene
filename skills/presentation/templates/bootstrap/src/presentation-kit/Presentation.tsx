import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PresentationMode } from './constants'
import { Footer, type AttributionOption } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title?: string
  initialMode?: PresentationMode
  /** Host-provided top-left brand slot; empty by default. */
  brand?: ReactNode
  attribution?: AttributionOption
  /** Minimum viewport width (px) at which browse mode shows the table of contents. */
  tocMinWidth?: number
}

function useViewportWidth(): number {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

/** Composes Stage, chrome, and navigation from an ordered list of steps. */
export function Presentation<TPayload = undefined>({
  steps,
  title,
  initialMode = 'present',
  brand,
  attribution,
  tocMinWidth = 1024,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const regionRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(regionRef, nav.mode, undefined, undefined, steps.length > 0)
  const wide = useViewportWidth() >= tocMinWidth
  const step = steps[nav.index]
  if (!step) return null
  const showToc = nav.mode === 'browse' && wide

  return (
    <div
      data-presentation-root
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}
    >
      <Header step={step} index={nav.index} count={steps.length} mode={nav.mode} brand={brand} title={title} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {showToc ? <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} /> : null}
        <div
          ref={regionRef}
          data-presentation-stage-region
          style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Stage step={step} index={nav.index} scale={scale} />
        </div>
      </div>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
        attribution={attribution}
      />
    </div>
  )
}
