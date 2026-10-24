import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { Stage } from './Stage'
import { DEFAULT_MODE, type Mode } from './constants'
import { usePresentationNav } from './usePresentationNav'
import { isWide, useViewport } from './useFitScale'
import { sectionIndexOf, sectionsOf, validateSteps } from './steps'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Attribution, type AttributionOptions } from './chrome/Attribution'
import type { AnyStep, Step } from './types'

export interface PresentationProps<TPayload> {
  steps: ReadonlyArray<Step<TPayload> | AnyStep>
  title: string
  /** Mode to open in; defaults to browse. */
  initialMode?: Mode
  /** Host-provided top-left branding. Empty by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  /** Design canvas size; defaults to 880 × 380. */
  canvas?: { width: number; height: number }
  className?: string
  style?: CSSProperties
}

/** One scene moving through named steps, with present/browse chrome and navigation. */
export function Presentation<TPayload = undefined>({
  steps,
  title,
  initialMode = DEFAULT_MODE,
  brand,
  attribution,
  canvas,
  className,
  style,
}: PresentationProps<TPayload>) {
  const all = steps as ReadonlyArray<AnyStep>
  const problems = validateSteps(all)
  if (problems.length > 0) throw new Error(`Invalid presentation steps: ${problems.join('; ')}`)

  const nav = usePresentationNav(all.length, initialMode)
  const { width } = useViewport()
  const sections = useMemo(() => sectionsOf(all), [all])
  const titles = useMemo(() => all.map((s) => s.title), [all])
  const step = all[nav.index]
  const showToc = nav.mode === 'browse' && isWide(width)

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={all.length}
      data-step-index={nav.index}
      data-presentation-step-id={step.id}
      className={className}
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', ...style }}
    >
      <Header brand={brand} title={title} mode={nav.mode} />
      {showToc && <Toc sections={sections} active={sectionIndexOf(sections, nav.index)} onJump={nav.jump} />}
      <Stage step={step} index={nav.index} mode={nav.mode} canvas={canvas} />
      <Footer
        mode={nav.mode}
        step={step}
        index={nav.index}
        count={all.length}
        titles={titles}
        onJump={nav.jump}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
