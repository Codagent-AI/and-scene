import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Attribution, type AttributionOptions } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { STAGE_LAYOUT, WIDE_VIEWPORT, type StageGeometry } from './constants'
import { Stage } from './Stage'
import type { Mode, Step } from './types'
import { useFitScale, useViewportSize } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { validateSteps } from './validate'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand; the kit renders none by default. */
  brand?: ReactNode
  /** `false` hides the default bottom-right attribution; an object overrides it. */
  attribution?: false | AttributionOptions
  designWidth?: number
  designHeight?: number
  stageLayout?: Record<Mode, StageGeometry>
  className?: string
  style?: CSSProperties
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  designWidth,
  designHeight,
  stageLayout = STAGE_LAYOUT,
  className,
  style,
}: PresentationProps<TPayload>) {
  const problems = validateSteps(steps)
  if (problems.length > 0) throw new Error(`Invalid presentation "${title}": ${problems.join('; ')}`)

  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode, { designWidth, designHeight, layout: stageLayout })
  const { width } = useViewportSize()
  const step = steps[nav.index]
  const marker = String(nav.index + 1).padStart(2, '0')
  const browse = nav.mode === 'browse'

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      className={className}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', ...style }}
    >
      <div
        data-presentation-stage-area=""
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: stageLayout[nav.mode].top,
          bottom: stageLayout[nav.mode].bottom,
        }}
      >
        <Stage step={step} index={nav.index} scale={scale} designWidth={designWidth} designHeight={designHeight} />
      </div>
      <Header brand={brand} marker={marker} era={step.era} mode={nav.mode} onToggleMode={nav.toggleMode} />
      {browse && width >= WIDE_VIEWPORT && (
        <Toc steps={steps} index={nav.index} top={stageLayout.browse.top} onJump={nav.goTo} />
      )}
      <Footer
        mode={nav.mode}
        step={step}
        steps={steps}
        index={nav.index}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
