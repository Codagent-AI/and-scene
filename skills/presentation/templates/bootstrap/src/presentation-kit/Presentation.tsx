import type { ReactNode } from 'react'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { useViewportWidth } from './chrome/useViewportWidth.ts'
import { TOC_MIN_WIDTH } from './constants.ts'
import { Stage } from './Stage.tsx'
import { usePresentationNav } from './usePresentationNav.ts'
import type { AttributionOptions, Canvas, Mode, Step } from './types.ts'

interface PresentationProps<TPayload> {
  steps: ReadonlyArray<Step<TPayload>>
  title: string
  initialMode?: Mode
  /** Host-provided top-left brand; none by default. */
  brand?: ReactNode
  /** Override the default attribution, or `null` to hide it. */
  attribution?: AttributionOptions | null
  canvas?: Canvas
}

/** One scene moving through named steps, with present/browse chrome and navigation. */
export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  canvas,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const width = useViewportWidth()
  const step = steps[nav.index]
  if (!step) return null
  const showToc = nav.mode === 'browse' && width >= TOC_MIN_WIDTH

  return (
    <div
      role="region"
      aria-label={title}
      data-presentation-root=""
      data-presentation-name={title}
      data-presentation-mode={nav.mode}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      <Header
        brand={brand}
        mode={nav.mode}
        title={step.title}
        era={step.era}
        index={nav.index}
        total={steps.length}
        onToggleMode={nav.toggleMode}
      />
      <div
        data-presentation-main=""
        style={{ display: 'grid', gridTemplateColumns: showToc ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)', minHeight: 0 }}
      >
        {showToc ? <Toc eras={steps.map((s) => s.era)} index={nav.index} onGoTo={nav.goTo} /> : null}
        <Stage step={step} stepIndex={nav.index} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer
        mode={nav.mode}
        title={step.title}
        caption={step.caption}
        stepTitles={steps.map((s) => s.title)}
        index={nav.index}
        attribution={attribution}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
    </div>
  )
}
