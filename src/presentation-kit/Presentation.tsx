import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { ATTRIBUTION_URL, DESIGN_H, DESIGN_W, STAGE_LAYOUT, TOC_MEDIA } from './constants'
import { sceneKey } from './sceneKey'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationMode, Step } from './types'

interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  brand?: ReactNode
  attribution?: ReactNode
  designWidth?: number
  designHeight?: number
  className?: string
}

function isWide() {
  return typeof window.matchMedia === 'function' && window.matchMedia(TOC_MEDIA).matches
}

function subscribeWidth(onChange: () => void) {
  const media = window.matchMedia?.(TOC_MEDIA)
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

function serverIsWide() {
  return false
}

export function Presentation<TPayload = undefined>({
  steps, title, initialMode = 'browse', brand,
  attribution = <a data-presentation-attribution="" href={ATTRIBUTION_URL}>made by and-scene</a>,
  designWidth = DESIGN_W, designHeight = DESIGN_H, className,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useSyncExternalStore(subscribeWidth, isWide, serverIsWide)
  const { index, mode, touchHandlers, toggleMode, jump, previous, next } = nav
  const layout = STAGE_LAYOUT[mode]
  const showToc = mode === 'browse' && wide
  const step = steps[index]
  if (!step) return null

  return (
    <section
      className={className}
      data-presentation=""
      data-presentation-mode={mode}
      data-presentation-era={step.era}
      data-step-index={index}
      data-step-count={steps.length}
      {...touchHandlers}
      style={{
        height: '100dvh',
        display: 'grid',
        gridTemplateRows: [
          `var(--presentation-header-height, ${layout.header}px)`,
          'minmax(0, 1fr)',
          `var(--presentation-footer-height, ${layout.footer}px)`,
          `var(--presentation-attribution-height, ${layout.attribution}px)`,
        ].join(' '),
      }}
    >
      <Header title={title} mode={mode} brand={brand} index={index} count={steps.length} toggleMode={toggleMode} />
      <div data-presentation-content="" style={{
        display: 'grid',
        minHeight: 0,
        gridTemplateColumns: showToc ? `var(--presentation-toc-width, ${layout.toc}) minmax(0, 1fr)` : 'minmax(0, 1fr)',
      }}>
        {showToc && <Toc steps={steps} index={index} jump={jump} />}
        <Stage step={step} stepIndex={index} sceneKey={sceneKey(steps, index)} width={designWidth} height={designHeight} />
      </div>
      <Footer mode={mode} steps={steps} index={index} jump={jump} previous={previous} next={next} />
      <div data-presentation-credit="" style={{ justifySelf: 'end', alignSelf: 'end' }}>{attribution}</div>
    </section>
  )
}
