import { useMemo, type ReactNode } from 'react'
import { Attribution } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { Stage } from './Stage.tsx'
import { computeEras, validateSteps } from './steps.ts'
import { isWideViewport, useViewport } from './useFitScale.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import type { AttributionOptions, DesignSize, Mode, Step, StepMeta } from './types.ts'

export interface PresentationProps<P> {
  steps: readonly Step<P>[]
  title: string
  initialMode?: Mode
  /** Host-provided header brand; the kit renders none by default. */
  brand?: ReactNode
  /** Override the attribution link, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  design?: DesignSize
}

/** Stage + chrome + navigation for an ordered list of scene steps. */
export function Presentation<P>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  design,
}: PresentationProps<P>) {
  validateSteps(steps)
  const { index, mode, next, prev, goTo } = usePresentationNav(steps.length, initialMode)
  const { width } = useViewport()
  const eras = useMemo(() => computeEras(steps), [steps])
  const titles = useMemo(() => steps.map((s) => s.title), [steps])
  const step = steps[index]
  const meta: StepMeta = {
    id: step.id,
    index,
    count: steps.length,
    era: step.era,
    title: step.title,
    caption: step.caption,
  }
  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <Header meta={meta} mode={mode} brand={brand} />
      {mode === 'browse' && isWideViewport(width) ? (
        <Toc eras={eras} activeIndex={index} onJump={goTo} />
      ) : null}
      <Stage step={step} meta={meta} mode={mode} design={design} />
      <Footer meta={meta} mode={mode} titles={titles} onPrev={prev} onNext={next} onJump={goTo} />
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
