import { WIDE_BREAKPOINT } from './constants.ts'
import { Attribution } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Stage } from './Stage.tsx'
import { useFitScale, useViewportSize } from './useFitScale.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import type { PresentationProps } from './types.ts'

export function Presentation<TPayload = undefined>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode)
  const viewport = useViewportSize()
  const step = steps[nav.index]
  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      <Header
        brand={brand}
        title={title}
        era={step.era}
        index={nav.index}
        count={steps.length}
        mode={nav.mode}
      />
      {/* Remounting per mode makes a mode switch a re-render, never a morph. */}
      <Stage key={nav.mode} step={step} index={nav.index} mode={nav.mode} scale={scale} />
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        showToc={viewport.width >= WIDE_BREAKPOINT}
        onJump={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution === false ? null : <Attribution>{attribution}</Attribution>}
    </div>
  )
}
