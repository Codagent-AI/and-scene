import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DESIGN_H, DESIGN_W, TOC_MIN_WIDTH } from './constants'
import { Attribution, type AttributionOptions } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Stage } from './Stage'
import { eraEntries } from './steps'
import type { AnyStep, Mode } from './types'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps {
  steps: readonly AnyStep[]
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand; empty by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution, or pass false to omit it. */
  attribution?: AttributionOptions | false
  canvas?: { width: number; height: number }
  /** Class on the root element, for presentation-scoped CSS. */
  className?: string
}

function useIsWide() {
  const [wide, setWide] = useState(() => window.innerWidth >= TOC_MIN_WIDTH)
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= TOC_MIN_WIDTH)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return wide
}

export function Presentation({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  canvas = { width: DESIGN_W, height: DESIGN_H },
  className,
}: PresentationProps) {
  if (steps.length === 0) throw new Error('Presentation requires at least one step')
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const eras = useMemo(() => eraEntries(steps), [steps])
  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <div
      data-presentation-root=""
      className={className}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={steps[nav.index].id}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header
        title={title}
        mode={nav.mode}
        step={steps[nav.index]}
        index={nav.index}
        count={steps.length}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      <Stage steps={steps} index={nav.index} mode={nav.mode} width={canvas.width} height={canvas.height} />
      <Footer
        mode={nav.mode}
        steps={steps}
        eras={eras}
        index={nav.index}
        showToc={wide}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
