import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { Header } from './chrome/Header.tsx'
import { Footer, type AttributionOptions } from './chrome/Footer.tsx'
import { Toc } from './chrome/Toc.tsx'
import { WIDE_QUERY } from './constants.ts'
import { Stage } from './Stage.tsx'
import { groupByEra } from './steps.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import type { AnyStep, Mode } from './types.ts'

export interface PresentationProps {
  steps: readonly AnyStep[]
  title: string
  initialMode?: Mode
  /** Design canvas override; defaults to 880 × 380. */
  design?: { width: number; height: number }
  /** Host-provided brand for the header; none by default. */
  brand?: ReactNode
  /** Override the default "made by and-scene" attribution, or pass `false` to hide it. */
  attribution?: AttributionOptions | false
}

const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const isWide = () => window.matchMedia(WIDE_QUERY).matches

/** Composes the stage, chrome, and navigation for an ordered list of steps. */
export function Presentation({ steps, title, initialMode = 'browse', design, brand, attribution }: PresentationProps) {
  const { index, mode, goTo, next, prev, swipe } = usePresentationNav(steps.length, initialMode)
  const wide = useSyncExternalStore(subscribeWide, isWide, () => true)
  const eras = useMemo(() => groupByEra(steps), [steps])
  const step = steps[index]
  const showToc = mode === 'browse' && wide

  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      data-step-id={step.id}
      {...swipe}
      style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0, touchAction: 'pan-y' }}
    >
      <Header mode={mode} index={index} count={steps.length} title={step.title} presentationTitle={title} brand={brand} />
      <div data-presentation-body="" style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
        {showToc && <Toc eras={eras} index={index} onJump={goTo} />}
        <Stage step={step} index={index} mode={mode} design={design} />
      </div>
      <Footer mode={mode} steps={steps} index={index} onJump={goTo} onPrev={prev} onNext={next} attribution={attribution} />
    </div>
  )
}
