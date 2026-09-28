import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import { useIsWideViewport } from './useIsWideViewport'
import type { PresentationProps } from './types'

/**
 * Composes the scene kit's Stage and chrome from a steps array into a full
 * presentation: navigation, present/browse modes, fixed-canvas fit scaling,
 * and the default attribution. Zero visual defaults — presentation-owned CSS
 * targets the exposed `data-presentation-*` hooks.
 */
export function Presentation({ steps, title, initialMode = 'browse' }: PresentationProps) {
  const { index, mode, next, prev, goTo, touchHandlers } = usePresentationNav({
    stepCount: steps.length,
    initialMode,
  })
  const isWide = useIsWideViewport()
  const step = steps[index]
  const marker = String(index + 1).padStart(2, '0')

  return (
    <div
      data-presentation-root="true"
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      {...touchHandlers}
      style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}
    >
      <Header mode={mode} marker={marker} title={step?.title ?? title} />
      <div data-presentation-body="true" style={{ display: 'flex', flex: '1 1 auto', minHeight: 0 }}>
        {mode === 'browse' && isWide ? <Toc steps={steps} activeIndex={index} onGoTo={goTo} /> : null}
        <Stage steps={steps} activeIndex={index} mode={mode} />
      </div>
      <Footer
        mode={mode}
        caption={step?.caption ?? ''}
        stepIndex={index}
        stepCount={steps.length}
        onGoTo={goTo}
        onPrev={prev}
        onNext={next}
      />
    </div>
  )
}
