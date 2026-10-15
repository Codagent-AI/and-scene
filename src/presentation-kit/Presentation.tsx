import type { ReactNode } from 'react'
import type { Mode } from './constants'
import type { AnyStep } from './types'
import { usePresentationNav } from './usePresentationNav'
import { deriveEras } from './navLogic'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer, type Attribution } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { useWideViewport } from './useWideViewport'

export interface PresentationProps<TSteps extends readonly AnyStep[]> {
  steps: TSteps
  title: string
  initialMode?: Mode
  /** Optional host-provided top-left brand. */
  brand?: ReactNode
  /** Override the default attribution link, or pass false to omit it. */
  attribution?: Attribution
}

export function Presentation<const TSteps extends readonly AnyStep[]>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
}: PresentationProps<TSteps>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  if (steps.length === 0) return null
  const step = steps[nav.index]
  const eras = deriveEras(steps)

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100vh' }}
    >
      <Header
        title={title}
        mode={nav.mode}
        index={nav.index}
        count={steps.length}
        stepTitle={step.title}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {nav.mode === 'browse' && wide && <Toc eras={eras} activeEra={step.era} onJump={nav.goTo} />}
        <Stage step={step} stepIndex={nav.index} mode={nav.mode} />
      </div>
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        attribution={attribution}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
    </div>
  )
}
