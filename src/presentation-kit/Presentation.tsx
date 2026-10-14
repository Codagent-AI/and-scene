import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from './constants'
import { hookAttrs, HOOK } from './hooks'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { stepNumber } from './stepModel'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationMode, Step } from './types'

export interface PresentationProps<TPayload> {
  /** Ordered steps. Numbering is derived from position. Needs at least one. */
  steps: ReadonlyArray<Step<TPayload>>
  title: string
  initialMode?: PresentationMode
  /** Host-provided top-left brand. The kit renders no brand by default. */
  brand?: ReactNode
  /** Bottom-right "made by and-scene" link. On by default. */
  attribution?: boolean
}

/** Composes the stage, chrome, and navigation for one scene. */
export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution = true,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav({ count: steps.length, initialMode })
  const { scale, rect, wide } = useFitScale(nav.mode)
  const step = steps[nav.index]
  if (!step) return null

  const layout = STAGE_LAYOUT[nav.mode]
  const browse = nav.mode === 'browse'

  return (
    <section
      aria-label={title}
      {...hookAttrs(HOOK.root)}
      {...hookAttrs(HOOK.mode, nav.mode)}
      {...hookAttrs(HOOK.stepCount, String(steps.length))}
      {...hookAttrs(HOOK.stepIndex, String(nav.index))}
      style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}
      {...nav.touchHandlers}
    >
      <Header
        height={layout.top}
        brand={brand}
        marker={stepNumber(nav.index)}
        title={browse ? step.title : undefined}
        mode={nav.mode}
        onToggleMode={nav.toggleMode}
      />
      {browse && wide ? (
        <Toc
          title={title}
          steps={steps}
          index={nav.index}
          top={layout.top}
          bottom={layout.bottom}
          width={layout.side}
          onGoTo={nav.goTo}
        />
      ) : null}
      <Stage step={step} rect={rect} scale={scale} />
      <Footer
        height={layout.bottom}
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution ? <Attribution /> : null}
    </section>
  )
}
