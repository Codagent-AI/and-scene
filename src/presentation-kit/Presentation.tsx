import { useRef, type ReactNode } from 'react'
import { ATTRIBUTION_HREF, ATTRIBUTION_TEXT } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { useViewportWide } from './useViewportWide'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  className?: string
  /** Host-provided header brand; the kit renders none by default. */
  brand?: ReactNode
  /** Replace the default attribution, or pass `false` to omit it. */
  attribution?: ReactNode | false
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'present',
  className,
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useViewportWide()
  const tocVisible = nav.mode === 'browse' && wide
  const regionRef = useRef<HTMLDivElement>(null)
  const fit = useFitScale(regionRef, nav.mode, tocVisible)
  const step = steps[nav.index]

  return (
    <div
      className={className}
      aria-label={title}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}
    >
      <Header
        mode={nav.mode}
        step={step}
        index={nav.index}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      {tocVisible && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
      <div
        ref={regionRef}
        data-presentation-stage=""
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
      >
        <Stage step={step} stepIndex={nav.index} fit={fit} />
      </div>
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution === false
        ? null
        : (attribution ?? (
            <a
              data-presentation-attribution=""
              href={ATTRIBUTION_HREF}
              target="_blank"
              rel="noreferrer"
              style={{ position: 'absolute', right: 0, bottom: 0, zIndex: 3 }}
            >
              {ATTRIBUTION_TEXT}
            </a>
          ))}
    </div>
  )
}
