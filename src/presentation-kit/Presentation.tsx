import { DESIGN_H, DESIGN_W } from './constants'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import { useMinWidth } from './useMinWidth'
import { WIDE_VIEWPORT } from './constants'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Attribution } from './chrome/Attribution'
import type { PresentationProps } from './types'

/** One evolving scene driven through ordered steps, with present/browse chrome. */
export function Presentation<TPayload = undefined>({
  steps,
  title,
  initialMode = 'browse',
  className,
  brand,
  attribution,
  canvas = { width: DESIGN_W, height: DESIGN_H },
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useMinWidth(WIDE_VIEWPORT)
  const step = steps[nav.index]
  const showToc = nav.mode === 'browse' && wide

  return (
    <div
      className={className}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={step?.id}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: 0 }}
    >
      <Header
        title={title}
        mode={nav.mode}
        index={nav.index}
        count={steps.length}
        era={step?.era ?? ''}
        brand={brand}
        onToggleMode={nav.toggleMode}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {showToc && <Toc steps={steps} index={nav.index} onJump={nav.goTo} />}
        <Stage steps={steps} index={nav.index} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
