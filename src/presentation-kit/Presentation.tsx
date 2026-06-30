import type { ReactNode } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { stepMarker } from './stepMarker'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'

export function Presentation({
  steps,
  initialMode = 'browse',
  title = 'Presentation',
  brand,
  homeHref = '/',
  homeLabel,
  background,
  overlay,
  marker,
}: {
  steps: Step[]
  initialMode?: Mode
  title?: string
  /** Header brand: defaults to the text "and-scene". Pass a logo node to override. */
  brand?: ReactNode
  /** Home link target for the header brand and the last-step footer button. */
  homeHref?: string
  /** Accessible label for the home link. */
  homeLabel?: string
  /** Full-bleed layer rendered behind the content; suppresses the opaque `bg-bg`. */
  background?: ReactNode
  /**
   * Full-bleed layer rendered *above* the content (e.g. a CRT/scanline overlay).
   * Unlike `background`, it paints over the chrome. Pointer events pass through,
   * so it never intercepts clicks. Use `background` for true backdrops.
   */
  overlay?: ReactNode
  /**
   * Override the per-step marker (top-right). Defaults to a zero-padded count.
   * A callback (not a per-step field) so hosts can number relationally — e.g.
   * skip chrome cards and count only body steps.
   */
  marker?: (index: number, steps: Step[]) => string
}) {
  const { step, setStep, next, prev, last, mode } = usePresentationNav(steps.length, initialMode)
  // An empty deck has no current step; render a clear placeholder instead of
  // crashing on `steps[step].title`. (Hooks above run unconditionally first.)
  if (steps.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-bg font-mono text-gray-300"
        data-presentation={title}
      >
        No steps to present.
      </div>
    )
  }
  const current = steps[step]
  const markerText = (marker ?? ((i) => stepMarker(i)))(step, steps)

  return (
    <div className="relative min-h-screen select-none overflow-hidden font-mono" data-presentation={title}>
      {background && <div className="absolute inset-0 z-0">{background}</div>}
      <div className={`relative z-10 min-h-screen ${background ? '' : 'bg-bg'}`}>
        <Stage step={current} mode={mode} />
        <Header
          marker={markerText}
          title={current.title}
          brand={brand}
          homeHref={homeHref}
          homeLabel={homeLabel}
        />
        {mode === 'browse' && <Toc steps={steps} step={step} onSelect={setStep} />}
        <Footer
          steps={steps}
          step={step}
          last={last}
          mode={mode}
          homeHref={homeHref}
          onPrev={prev}
          onNext={next}
          onSelect={setStep}
        />
      </div>
      {overlay && <div className="pointer-events-none absolute inset-0 z-50">{overlay}</div>}
    </div>
  )
}
