import type { ReactNode } from 'react'
import { Attribution, type AttributionOptions } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { DEFAULT_DESIGN } from './constants.ts'
import { Stage } from './Stage.tsx'
import type { DesignSize, Mode, Step } from './types.ts'
import { isWide } from './useFitScale.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import { useViewport } from './useViewport.ts'

export interface PresentationProps<P> {
  steps: readonly Step<P>[]
  title?: string
  initialMode?: Mode
  /** Host-provided brand for the top-left slot; empty by default. */
  brand?: ReactNode
  /** Override the default attribution link, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  design?: DesignSize
  className?: string
}

export function Presentation<P>({
  steps,
  title,
  initialMode = 'present',
  brand,
  attribution,
  design = DEFAULT_DESIGN,
  className,
}: PresentationProps<P>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  if (steps.length === 0) return null
  const { index, mode } = nav
  const tocVisible = mode === 'browse' && isWide(viewport)

  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      className={className}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header brand={brand} step={steps[index]} index={index} mode={mode} onToggleMode={nav.toggleMode} />
      {tocVisible && <Toc steps={steps} index={index} onJump={nav.goTo} />}
      <Stage steps={steps} index={index} mode={mode} design={design} tocVisible={tocVisible} />
      <Footer steps={steps} index={index} mode={mode} onJump={nav.goTo} onPrev={nav.prev} onNext={nav.next} />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
