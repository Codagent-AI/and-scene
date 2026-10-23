import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ATTRIBUTION, DEFAULT_CANVAS, WIDE_VIEWPORT } from './constants'
import type { Canvas, Mode } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Attribution, PresentationStep } from './types'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps {
  steps: readonly PresentationStep[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left branding; nothing is rendered by default. */
  brand?: ReactNode
  /** Override the default attribution, or pass false to hide it. */
  attribution?: Attribution | false
  canvas?: Canvas
}

function useIsWide(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_VIEWPORT)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= WIDE_VIEWPORT)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return wide
}

export function Presentation({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution = ATTRIBUTION,
  canvas = DEFAULT_CANVAS,
}: PresentationProps) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const step = steps[nav.index]
  if (!step) return null

  return (
    <div
      data-presentation-root=""
      aria-label={title}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={step.id}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      <Header
        mode={nav.mode}
        index={nav.index}
        count={steps.length}
        title={step.title}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      <div data-presentation-main="" style={{ display: 'flex', minHeight: 0, minWidth: 0 }}>
        {nav.mode === 'browse' && wide ? <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} /> : null}
        <Stage step={step} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer mode={nav.mode} steps={steps} index={nav.index} attribution={attribution} onGoTo={nav.goTo} />
    </div>
  )
}
