import type { CSSProperties, ReactNode } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { dataHooks, type DataHooks } from './nodes/geometry'
import { eraEntries, stepNumber } from './eras'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { Canvas, Mode, Step } from './types'
import { useFitScale } from './useFitScale'
import { useIsWide } from './useMediaQuery'
import { usePresentationNav } from './usePresentationNav'

export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'

export interface PresentationProps<TPayload> extends DataHooks {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Overrides the 880 × 380 design canvas. */
  canvas?: Canvas
  /** `false` hides the default attribution; a node replaces it. */
  attribution?: ReactNode | false
  /** Host-provided top-left brand; none by default. */
  brand?: ReactNode
  className?: string
  style?: CSSProperties
}

function DefaultAttribution() {
  return (
    <a
      data-presentation-attribution=""
      href={ATTRIBUTION_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ position: 'fixed', right: 0, bottom: 0 }}
    >
      made by and-scene
    </a>
  )
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  canvas,
  attribution,
  brand,
  className,
  style,
  ...hooks
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode, canvas ?? { width: DESIGN_W, height: DESIGN_H })
  const wide = useIsWide()
  const step = steps[nav.index]
  const showAttribution =
    attribution === false ? null : attribution === undefined ? <DefaultAttribution /> : attribution
  const marker = `${stepNumber(nav.index)} / ${steps.length}`

  return (
    <div
      {...dataHooks(hooks)}
      data-presentation-root=""
      className={className}
      style={style}
      data-presentation-title-text={title}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={step.id}
      {...nav.touchHandlers}
    >
      <Header mode={nav.mode} marker={marker} title={title} brand={brand} onToggleMode={nav.toggleMode} />
      {nav.mode === 'browse' && wide ? (
        <Toc entries={eraEntries(steps)} activeEra={step.era} onGoTo={nav.goTo} />
      ) : null}
      <Stage step={step} index={nav.index} scale={scale} mode={nav.mode} canvas={canvas} />
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        attribution={showAttribution}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
    </div>
  )
}
