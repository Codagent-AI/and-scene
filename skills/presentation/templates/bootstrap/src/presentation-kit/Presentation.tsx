import type { ReactNode } from 'react'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Stage } from './Stage'
import type { AttributionOptions, Mode, Step } from './types'
import { useFitScale } from './useFitScale'
import { useIsWide } from './useIsWide'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload> {
  steps: ReadonlyArray<Step<TPayload>>
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand; none by default. */
  brand?: ReactNode
  /** Override the default attribution link, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
}

/** Composes the Stage, chrome, and navigation for a list of steps. */
export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode)
  const wide = useIsWide()
  const step = steps[nav.index]
  if (!step) return null
  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={nav.mode}
      data-presentation-step-id={step.id}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}
    >
      <Header mode={nav.mode} marker={nav.index + 1} total={steps.length} title={step.title} brand={brand} />
      <Stage step={step} stepIndex={nav.index} mode={nav.mode} scale={scale} />
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        wide={wide}
        onJump={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
