import { useEffect } from 'react'
import { Stage } from './Stage.tsx'
import { Attribution } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { stepNumber } from './steps.ts'
import type { PresentationProps } from './types.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import { isWideViewport, useViewport } from './useFitScale.ts'

/** One evolving scene stepped through `steps`, with present and browse modes. */
export function Presentation<TPayload = undefined>({
  steps,
  title,
  initialMode = 'present',
  brand,
  attribution = true,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav({ count: steps.length, initialMode })
  const { width } = useViewport()
  useEffect(() => {
    document.title = title
  }, [title])
  const step = steps[nav.index]
  if (!step) return null
  const showToc = nav.mode === 'browse' && isWideViewport(width)

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <Header mode={nav.mode} number={stepNumber(nav.index)} era={step.era} title={step.title} brand={brand} />
      {showToc ? <Toc steps={steps} index={nav.index} onJump={nav.goTo} /> : null}
      <Stage step={step} stepIndex={nav.index} mode={nav.mode} showToc={showToc} />
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        onPrev={nav.prev}
        onNext={nav.next}
        onJump={nav.goTo}
      />
      {attribution ? <Attribution /> : null}
    </div>
  )
}
