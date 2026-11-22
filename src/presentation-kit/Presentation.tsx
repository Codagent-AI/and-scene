import type { CSSProperties, ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { STAGE_LAYOUT } from './constants'
import { usePresentationNav } from './usePresentationNav'
import { useWideViewport } from './useFitScale'
import type { Mode, Step } from './types'

export interface PresentationProps<T> {
  steps: readonly Step<T>[]
  title: string
  initialMode?: Mode
  brand?: ReactNode
  attribution?: ReactNode
  className?: string
  style?: CSSProperties
  designWidth?: number
  designHeight?: number
}
export function Presentation<T>(props: PresentationProps<T>) {
  if (!props.steps.length)
    throw new Error('A presentation requires at least one step')
  return <PresentationBody {...props} />
}
function PresentationBody<T>({
  steps,
  title,
  initialMode,
  brand,
  attribution,
  className,
  style,
  designWidth,
  designHeight,
}: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  const geometry = STAGE_LAYOUT[nav.mode]
  const step = steps[nav.index]
  return (
    <main
      aria-label={title}
      className={className}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-id={step.id}
      data-step-era={step.era}
      data-step-count={steps.length}
      data-step-index={nav.index}
      onTouchStart={nav.onTouchStart}
      onTouchEnd={nav.onTouchEnd}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: 0,
        ...style,
      }}
    >
      <div style={{ flex: `0 0 ${geometry.header}px` }}>
        <Header
          step={step}
          index={nav.index}
          mode={nav.mode}
          brand={brand}
          toggle={nav.toggle}
        />
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {nav.mode === 'browse' && wide && (
          <Toc steps={steps} index={nav.index} go={nav.go} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            left: wide ? geometry.tocWidth : 0,
          }}
        >
          <Stage step={step} width={designWidth} height={designHeight} />
        </div>
      </div>
      <div style={{ flex: `0 0 ${geometry.footer}px` }}>
        <Footer
          steps={steps}
          index={nav.index}
          mode={nav.mode}
          go={nav.go}
          next={nav.next}
          prev={nav.prev}
        />
      </div>
      <div
        style={{ position: 'absolute', bottom: 12, right: 16 }}
        data-presentation-attribution-slot=""
      >
        {attribution === undefined ? (
          <a
            data-presentation-attribution=""
            href="https://github.com/Codagent-AI/and-scene"
          >
            made by and-scene
          </a>
        ) : (
          attribution
        )}
      </div>
    </main>
  )
}
