import type { ReactNode } from 'react'
import { ATTRIBUTION, CHROME, type Mode } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Canvas, Step } from './types'
import { useIsWide } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export interface AttributionOptions {
  label?: string
  href?: string
}

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  /** Mode the presentation opens in; defaults to `browse`. */
  initialMode?: Mode
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: ReactNode
  /** Override the bottom-right attribution, or `false` to omit it. */
  attribution?: AttributionOptions | false
  canvas?: Canvas
  /** Class applied to the root so presentation-owned CSS can scope itself. */
  className?: string
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode,
  brand,
  attribution,
  canvas,
  className,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const step = steps[nav.index]
  if (!step) return null
  const browse = nav.mode === 'browse'
  const link = attribution === false ? null : { ...ATTRIBUTION, ...attribution }

  return (
    <div
      data-presentation-root
      className={className}
      data-presentation-title-text={title}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <Header
        mode={nav.mode}
        index={nav.index}
        count={steps.length}
        era={step.era}
        title={step.title}
        brand={brand}
      />
      {browse && wide && (
        <Toc eras={steps.map((s) => s.era)} activeEra={step.era} onGoTo={nav.goTo} />
      )}
      <Stage step={step} mode={nav.mode} canvas={canvas} />
      <Footer
        mode={nav.mode}
        index={nav.index}
        stepIds={steps.map((s) => s.id)}
        stepTitles={steps.map((s) => s.title)}
        title={step.title}
        caption={step.caption}
        onPrev={nav.prev}
        onNext={nav.next}
        onGoTo={nav.goTo}
      />
      {link && (
        <a
          data-presentation-attribution
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            height: CHROME.attributionH,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {link.label}
        </a>
      )}
    </div>
  )
}
