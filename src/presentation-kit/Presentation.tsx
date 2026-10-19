import type { ReactNode } from 'react'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import type { Mode } from './constants.ts'
import { Attribution } from './chrome/Attribution.tsx'
import type { AttributionOptions } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { isWide } from './fit.ts'
import { Stage } from './Stage.tsx'
import type { Step } from './types.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import { useViewport } from './useViewport.ts'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Override the 880 × 380 design canvas. */
  canvas?: { width: number; height: number }
  /** Host-provided header brand; the kit renders none by default. */
  brand?: ReactNode
  /** Attribution link options, or null to omit it. */
  attribution?: AttributionOptions | null
}

export function Presentation<TPayload>({
  steps, title, initialMode = 'present', canvas = { width: DESIGN_W, height: DESIGN_H }, brand, attribution = {},
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  const step = steps[nav.index]
  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
    >
      <Stage steps={steps} index={nav.index} mode={nav.mode} canvas={canvas} />
      <Header step={step} index={nav.index} count={steps.length} mode={nav.mode} brand={brand} onToggleMode={nav.toggleMode} />
      {nav.mode === 'browse' && isWide(viewport.width) ? <Toc steps={steps} index={nav.index} onJump={nav.goTo} /> : null}
      <Footer steps={steps} index={nav.index} mode={nav.mode} onPrev={nav.prev} onNext={nav.next} onJump={nav.goTo} />
      {attribution ? <Attribution {...attribution} /> : null}
    </div>
  )
}
