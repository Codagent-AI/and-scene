import type { ReactNode } from 'react'
import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL, STAGE_LAYOUT } from './constants.ts'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { sectionsOf } from './chrome/sections.ts'
import { Toc } from './chrome/Toc.tsx'
import { Stage } from './Stage.tsx'
import type { AttributionOptions, CanvasSize, Mode, Step } from './types.ts'
import { showsToc, useFitScale } from './useFitScale.ts'
import { usePresentationNav } from './usePresentationNav.ts'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left branding; nothing is rendered by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  /** Override the default 880 × 380 design canvas. */
  canvas?: CanvasSize
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'present',
  brand,
  attribution,
  canvas,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav({ count: steps.length, initialMode })
  const { viewport, scale } = useFitScale(nav.mode, canvas)
  const toc = showsToc(nav.mode, viewport.width)
  const g = STAGE_LAYOUT[nav.mode]
  const step = steps[nav.index]
  const attr = attribution === false ? null : { label: ATTRIBUTION_LABEL, href: ATTRIBUTION_HREF, ...attribution }

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={step.id}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header title={title} mode={nav.mode} brand={brand} onToggleMode={nav.toggleMode} />
      {toc ? <Toc sections={sectionsOf(steps)} activeIndex={nav.index} onJump={nav.goTo} /> : null}
      <main
        data-presentation-main=""
        style={{
          position: 'absolute',
          top: g.top,
          bottom: g.bottom,
          left: g.side + (toc ? g.tocWidth : 0),
          right: g.side,
        }}
      >
        <Stage step={step} stepIndex={nav.index} scale={scale} canvas={canvas} />
      </main>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onJump={nav.goTo}
        onNext={nav.next}
        onPrev={nav.prev}
      />
      {attr ? (
        <a
          data-presentation-attribution=""
          href={attr.href}
          target="_blank"
          rel="noreferrer"
          style={{ position: 'absolute', right: 16, bottom: 8 }}
        >
          {attr.label}
        </a>
      ) : null}
    </div>
  )
}
