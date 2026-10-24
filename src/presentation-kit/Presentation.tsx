import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from './constants.ts'
import { Attribution } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { Stage } from './Stage.tsx'
import { eraSections, formatMarker, sectionIndexOf } from './steps.ts'
import type { Canvas, Mode, Step } from './types.ts'
import { isWideViewport, useFitScale } from './useFitScale.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import { useViewportSize } from './useViewportSize.ts'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  /** Names the presentation for assistive technology. */
  title: string
  /** Mode the presentation opens in; defaults to browse. */
  initialMode?: Mode
  /** Host-provided top-left branding; nothing is shown by default. */
  brand?: ReactNode
  /** Replaces the default bottom-right attribution; `null` removes it. */
  attribution?: ReactNode
  canvas?: Canvas
  className?: string
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  canvas,
  className,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { mode, index } = nav
  const scale = useFitScale(mode, canvas)
  const { width } = useViewportSize()
  const step = steps[index]
  if (!step) return null

  const layout = STAGE_LAYOUT[mode]
  const sections = eraSections(steps)
  const showToc = mode === 'browse' && isWideViewport(width)

  return (
    <div
      data-presentation-root=""
      data-step-count={steps.length}
      data-step-index={index}
      data-step-id={step.id}
      data-mode={mode}
      role="region"
      aria-label={title}
      className={className}
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <Header
        brand={brand}
        marker={formatMarker(index, steps.length)}
        title={mode === 'browse' ? step.title : undefined}
        mode={mode}
        onToggleMode={nav.toggleMode}
        height={layout.top}
      />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showToc && (
          <Toc
            sections={sections}
            activeSection={sectionIndexOf(sections, index)}
            width={layout.toc}
            onJump={nav.goTo}
          />
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stage step={step} index={index} mode={mode} scale={scale} canvas={canvas} />
        </div>
      </div>
      <Footer
        mode={mode}
        step={step}
        steps={steps}
        index={index}
        height={layout.bottom}
        onJump={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution === undefined ? <Attribution /> : attribution}
    </div>
  )
}
