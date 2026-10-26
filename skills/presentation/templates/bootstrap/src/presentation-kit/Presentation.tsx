import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'
import { useWideViewport } from './useWideViewport'

const DEFAULT_ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  headerBrand,
  attributionHref = DEFAULT_ATTRIBUTION_HREF,
}: PresentationProps<TPayload>) {
  if (steps.length === 0) throw new Error('A presentation requires at least one step.')
  const { index, mode, goTo, next, prev, onTouchStart, onTouchEnd } = usePresentationNav(steps.length, initialMode)
  const isWideViewport = useWideViewport()
  const step = steps[index]!
  const previousStep = steps[index - 1]

  return (
    <main
      data-testid="presentation-root"
      data-presentation-root
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      aria-label={title}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Header step={step} mode={mode} brand={headerBrand} />
      {mode === 'browse' && isWideViewport ? <Toc steps={steps} index={index} goTo={goTo} /> : null}
      <Stage step={step} index={index} mode={mode} previousStep={previousStep} />
      <Footer steps={steps} step={step} index={index} mode={mode} goTo={goTo} next={next} prev={prev} />
      <a href={attributionHref} data-presentation-attribution>made by and-scene</a>
    </main>
  )
}
