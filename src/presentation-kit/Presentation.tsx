import { useMemo } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Attribution } from './chrome/Attribution'
import { Stage } from './Stage'
import { TOC_MIN_WIDTH, DESIGN_H, DESIGN_W } from './constants'
import { bodyStyle, rootStyle } from './layout'
import { usePresentationNav } from './usePresentationNav'
import { useViewportWidth } from './useViewportWidth'
import type { PresentationProps } from './types'

/**
 * A presentation: one scene walked through ordered steps, with present/browse
 * chrome, keyboard/touch/on-screen navigation, and the attribution link.
 */
export function Presentation<P>({
  steps,
  title,
  initialMode = 'present',
  attribution = true,
  brand,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
}: PresentationProps<P>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewportWidth = useViewportWidth()
  const eras = useMemo(() => [...new Set(steps.map((s) => s.era))], [steps])
  const step = steps[nav.index]
  const showToc = nav.mode === 'browse' && viewportWidth >= TOC_MIN_WIDTH

  if (!step) return null

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={rootStyle}
    >
      <Header
        brand={brand}
        number={nav.index + 1}
        total={steps.length}
        era={step.era}
        title={title}
        mode={nav.mode}
        onToggleMode={nav.toggleMode}
      />
      <div style={bodyStyle}>
        {showToc ? <Toc steps={steps} eras={eras} index={nav.index} onGoTo={nav.goTo} /> : null}
        <Stage steps={steps} index={nav.index} mode={nav.mode} designWidth={designWidth} designHeight={designHeight} />
      </div>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
      {attribution ? <Attribution /> : null}
    </div>
  )
}
