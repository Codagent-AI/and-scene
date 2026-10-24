import { useEffect, useState, type ReactNode } from 'react'
import { Attribution, type AttributionOptions } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import type { ChromeSlots } from './chrome/slots.ts'
import { Toc } from './chrome/Toc.tsx'
import { DEFAULT_MODE, TOC_MIN_VIEWPORT } from './constants.ts'
import { Stage } from './Stage.tsx'
import type { Canvas, Mode, Step } from './types.ts'
import { usePresentationNav } from './usePresentationNav.ts'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title?: string
  initialMode?: Mode
  canvas?: Canvas
  /** Host-provided top-left brand. */
  brand?: ReactNode
  /** Override the default "made by and-scene" attribution, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  /** Props forwarded to individual chrome parts for presentation-owned styling. */
  slots?: ChromeSlots
}

function useViewportWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/** Hosts a list of steps as one evolving scene with present/browse chrome and navigation. */
export function Presentation<TPayload>({
  steps,
  title,
  initialMode = DEFAULT_MODE,
  canvas,
  brand,
  attribution,
  slots = {},
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewportWidth = useViewportWidth()
  const step = steps[nav.index]
  if (!step) return null
  const showToc = nav.mode === 'browse' && viewportWidth >= TOC_MIN_VIEWPORT

  return (
    <div
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}
      {...slots.root}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={step.id}
    >
      <Header
        step={step}
        index={nav.index}
        mode={nav.mode}
        deckTitle={title}
        brand={brand}
        onToggleMode={nav.toggleMode}
        slot={slots.header}
        toggleSlot={slots.modeToggle}
      />
      <div style={{ display: 'flex', flex: '1 1 auto', minHeight: 0 }} data-presentation-main="">
        {showToc ? <Toc steps={steps} index={nav.index} onJump={nav.goTo} slot={slots.toc} /> : null}
        <Stage
          step={step}
          index={nav.index}
          mode={nav.mode}
          canvas={canvas}
          viewportSlot={slots.stage}
          canvasSlot={slots.canvas}
        />
      </div>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onJump={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
        slot={slots.footer}
        progressSlot={slots.progress}
        prevSlot={slots.prev}
        nextSlot={slots.next}
      />
      {attribution === false ? null : <Attribution options={attribution} slot={slots.attribution} />}
    </div>
  )
}
