import { useEffect, type ReactNode } from 'react'
import { DEFAULT_ATTRIBUTION } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { isWide, useViewport } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { AttributionOptions, Canvas, Mode, Step } from './types'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  canvas?: Canvas
  /** Host-provided header brand (none by default). */
  brand?: ReactNode
  /** Override the bottom-right attribution; `null` removes it. */
  attribution?: AttributionOptions | null
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'present',
  canvas,
  brand,
  attribution = {},
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  const step = steps[nav.index]
  const { mode } = nav

  useEffect(() => {
    document.title = title
  }, [title])

  const attr = attribution && { ...DEFAULT_ATTRIBUTION, ...attribution }

  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={mode}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <Header
        step={step}
        index={nav.index}
        count={steps.length}
        mode={mode}
        brand={brand}
        modeToggle={
          <button type="button" data-presentation-mode-toggle="" onClick={nav.toggleMode}>
            {mode === 'browse' ? 'Present' : 'Browse'}
          </button>
        }
      />
      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex' }}>
        {mode === 'browse' && isWide(viewport.width) ? <Toc steps={steps} index={nav.index} onJump={nav.goTo} /> : null}
        <Stage step={step} index={nav.index} mode={mode} canvas={canvas} />
      </div>
      <Footer steps={steps} index={nav.index} mode={mode} onJump={nav.goTo} onPrev={nav.prev} onNext={nav.next} />
      {attr ? (
        <a
          data-presentation-attribution=""
          href={attr.href}
          target="_blank"
          rel="noreferrer"
          style={{ position: 'absolute', right: 0, bottom: 0 }}
        >
          {attr.label}
        </a>
      ) : null}
    </div>
  )
}
