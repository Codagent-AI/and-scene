import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  attribution,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const current = steps[nav.stepIndex]
  if (!current) return null

  const move = (nextIndex: number) => nav.goTo(nextIndex)
  const next = () => nav.next()
  const previousStep = () => nav.previous()

  return (
    <main
      data-presentation-root
      data-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.stepIndex}
      onTouchStart={nav.onTouchStart}
      onTouchEnd={nav.onTouchEnd}
    >
      <Header mode={nav.mode} step={current} />
      {nav.mode === 'browse' ? <Toc steps={steps} stepIndex={nav.stepIndex} onGoTo={move} /> : null}
      <Stage current={current} stepIndex={nav.stepIndex} mode={nav.mode} />
      <Footer mode={nav.mode} title={title} step={current} stepIndex={nav.stepIndex} steps={steps} onGoTo={move} onNext={next} onPrevious={previousStep} />
      {attribution === false ? null : attribution ?? <a data-presentation-attribution href="https://github.com/openai/and-scene">made by and-scene</a>}
    </main>
  )
}
