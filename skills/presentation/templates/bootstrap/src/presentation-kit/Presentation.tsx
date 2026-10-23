import type { ReactNode } from 'react'
import { Attribution } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { Stage } from './Stage.tsx'
import type { Canvas, Mode, Step } from './types.ts'
import { useFitScale, useIsWide } from './useFitScale.ts'
import { usePresentationNav } from './usePresentationNav.ts'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left branding. */
  brand?: ReactNode
  /** Set false to omit the default bottom-right attribution. */
  attribution?: boolean
  canvas?: Canvas
  className?: string
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution = true,
  canvas,
  className,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const showToc = nav.mode === 'browse' && wide
  const scale = useFitScale(nav.mode, showToc, canvas)
  const step = steps[nav.index]
  return (
    <div
      className={className}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header
        mode={nav.mode}
        deckTitle={title}
        marker={nav.index + 1}
        count={steps.length}
        brand={brand}
      />
      {showToc && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
      <Stage step={step} mode={nav.mode} scale={scale} showSide={showToc} canvas={canvas} />
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution && <Attribution />}
    </div>
  )
}
