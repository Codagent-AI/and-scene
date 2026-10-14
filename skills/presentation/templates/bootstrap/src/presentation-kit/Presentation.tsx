import type { ReactNode } from 'react'
import { ATTRIBUTION_LABEL, ATTRIBUTION_URL } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Mode, Step } from './types'
import { isWideViewport, useViewportSize } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export interface AttributionOptions {
  label?: string
  href?: string
}

export interface PresentationProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: readonly Step<any>[]
  title: string
  /** Defaults to "browse". */
  initialMode?: Mode
  /** Override the default attribution link, or `false` to omit it. */
  attribution?: AttributionOptions | false
  /** Host-provided brand for the top-left header slot; empty by default. */
  brand?: ReactNode
}

export function Presentation({
  steps,
  title,
  initialMode = 'browse',
  attribution,
  brand,
}: PresentationProps) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { width } = useViewportSize()
  const step = steps[nav.index]
  if (!step) return null
  const showToc = nav.mode === 'browse' && isWideViewport(width)
  const attr =
    attribution === false
      ? null
      : {
          label: attribution?.label ?? ATTRIBUTION_LABEL,
          href: attribution?.href ?? ATTRIBUTION_URL,
        }

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'fixed', inset: 0 }}
    >
      <Header
        mode={nav.mode}
        title={title}
        index={nav.index}
        count={steps.length}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      {showToc && <Toc steps={steps} activeIndex={nav.index} onJump={nav.goTo} />}
      <Stage step={step} index={nav.index} mode={nav.mode} />
      <Footer
        mode={nav.mode}
        step={step}
        steps={steps}
        index={nav.index}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
        attribution={attr}
      />
    </div>
  )
}
