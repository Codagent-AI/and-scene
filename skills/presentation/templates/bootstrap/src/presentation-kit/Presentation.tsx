import { useEffect, useState, type ReactNode } from 'react'
import { Footer, type AttributionOption } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { TOC_MIN_WIDTH, type Mode } from './constants'
import { Stage } from './Stage'
import type { Step } from './types'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  design?: { width: number; height: number }
  /** Host-provided top-left brand; nothing is rendered by default. */
  brand?: ReactNode
  /** Bottom-right attribution; `false` removes it. */
  attribution?: AttributionOption
}

function useIsWide(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= TOC_MIN_WIDTH)
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= TOC_MIN_WIDTH)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return wide
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  design,
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  const { index, mode, next, prev, goTo } = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const step = steps[index]

  return (
    <div
      data-presentation-root=""
      role="region"
      aria-label={title}
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      data-step-id={step.id}
      data-step-era={step.era}
      data-presentation-title={step.title}
      data-presentation-caption={step.caption}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}
    >
      <Header mode={mode} index={index} count={steps.length} step={step} brand={brand} />
      <div style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
        {mode === 'browse' && wide && <Toc steps={steps} index={index} onJump={goTo} />}
        <Stage steps={steps} index={index} mode={mode} design={design} />
      </div>
      <Footer
        mode={mode}
        index={index}
        steps={steps}
        onJump={goTo}
        onPrev={prev}
        onNext={next}
        attribution={attribution}
      />
    </div>
  )
}
