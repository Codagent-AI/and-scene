import type { ReactNode } from 'react'
import { Attribution, type AttributionOptions } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { isWide } from './geometry.ts'
import { Stage } from './Stage.tsx'
import type { Mode, Step } from './types.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import { useViewport } from './useViewport.ts'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host branding for the top-left header slot. Empty by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution, or pass false to omit it. */
  attribution?: AttributionOptions | false
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { width } = useViewport()
  // Steps can be removed while the viewer is on a later one; show the last remaining step.
  const index = Math.min(nav.index, steps.length - 1)
  const step = steps[index]
  return (
    <div
      data-presentation-root=""
      data-presentation-chrome=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={index}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header step={step} index={index} mode={nav.mode} title={title} brand={brand} />
      <Stage step={step} mode={nav.mode} />
      <Footer
        steps={steps}
        index={index}
        mode={nav.mode}
        wide={isWide(width)}
        onJump={nav.goTo}
        onNext={nav.next}
        onPrev={nav.prev}
        onToggleMode={nav.toggleMode}
      />
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
