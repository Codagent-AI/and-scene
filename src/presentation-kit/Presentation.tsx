import { useEffect, useState, type ReactNode } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import {
  DEFAULT_ATTRIBUTION,
  DESIGN_H,
  DESIGN_W,
  STAGE_LAYOUT,
  WIDE_VIEWPORT,
} from './constants'
import { Stage } from './Stage'
import type { AttributionOptions, Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  /** Host-provided brand for the top-left header slot (none by default). */
  brand?: ReactNode
  /** Override the bottom-right attribution, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
  designWidth?: number
  designHeight?: number
}

function useIsWide() {
  const read = () => typeof window !== 'undefined' && window.innerWidth >= WIDE_VIEWPORT
  const [wide, setWide] = useState(read)
  useEffect(() => {
    const onResize = () => setWide(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return wide
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
}: PresentationProps<TPayload>) {
  const { index, mode, goTo, next, prev } = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const geo = STAGE_LAYOUT[mode]
  const showToc = mode === 'browse' && wide
  const left = geo.side + (showToc ? geo.tocInset : 0)
  const attr = attribution === false ? null : { ...DEFAULT_ATTRIBUTION, ...attribution }
  const step = steps[index]

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header
        mode={mode}
        title={title}
        step={step}
        index={index}
        count={steps.length}
        brand={brand}
        height={geo.top}
      />
      {showToc && (
        <Toc
          steps={steps}
          index={index}
          width={geo.tocInset}
          top={geo.top}
          bottom={geo.bottom}
          onGo={goTo}
        />
      )}
      <Stage
        step={step}
        index={index}
        designW={designWidth}
        designH={designHeight}
        box={{ left, right: geo.side, top: geo.top, bottom: geo.bottom }}
      />
      <Footer
        mode={mode}
        steps={steps}
        index={index}
        height={geo.bottom}
        onGo={goTo}
        onPrev={prev}
        onNext={next}
      />
      {attr && (
        <a
          data-presentation-attribution=""
          href={attr.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ position: 'fixed', right: 12, bottom: 8 }}
        >
          {attr.label}
        </a>
      )}
    </div>
  )
}
