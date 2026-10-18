import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { TOC_MIN_WIDTH } from './constants'
import type { PresentationMode } from './constants'
import { Stage } from './Stage'
import { validateSteps } from './steps'
import type { Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { useViewportWidth } from './useViewportWidth'
import { Attribution } from './chrome/Attribution'
import type { AttributionOptions } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  /** Host-provided top-left brand; no default is rendered. */
  brand?: ReactNode
  /** Options for the default bottom-right attribution, or `false` to omit it. */
  attribution?: AttributionOptions | false
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  validateSteps(steps)
  const nav = usePresentationNav(steps.length, initialMode)
  const viewportWidth = useViewportWidth()
  const step = steps[nav.index]
  useEffect(() => {
    document.title = title
  }, [title])
  const showToc = nav.mode === 'browse' && viewportWidth >= TOC_MIN_WIDTH

  return (
    <div
      data-presentation-root=""
      aria-label={title}
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}
    >
      <Header index={nav.index} count={steps.length} title={step.title} mode={nav.mode} brand={brand} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {showToc ? <Toc steps={steps} index={nav.index} onJump={nav.goTo} /> : null}
        <Stage steps={steps} index={nav.index} mode={nav.mode} />
      </div>
      <Footer
        step={step}
        index={nav.index}
        count={steps.length}
        mode={nav.mode}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
