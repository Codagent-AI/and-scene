import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'
import { classNames } from './utils'

const DEFAULT_ATTRIBUTION = 'https://github.com/Codagent-AI/and-scene'

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  className,
  attributionHref = DEFAULT_ATTRIBUTION,
}: PresentationProps<TPayload>) {
  const navigation = usePresentationNav(steps.length, initialMode)
  if (steps.length === 0) {
    throw new Error('Presentation requires at least one step.')
  }
  const step = steps[navigation.index]

  if (!step) throw new Error('Presentation could not resolve the active step.')

  return (
    <main
      className={classNames('presentation', className)}
      aria-label={title}
      data-presentation="true"
      data-presentation-mode={navigation.mode}
      data-step-count={steps.length}
      data-step-index={navigation.index}
      onTouchEnd={navigation.onTouchEnd}
      onTouchStart={navigation.onTouchStart}
    >
      <Header mode={navigation.mode} step={step} />
      {navigation.mode === 'browse' ? (
        <Toc activeIndex={navigation.index} onGoTo={navigation.goTo} steps={steps} />
      ) : null}
      <Stage mode={navigation.mode} step={step} stepCount={steps.length} stepIndex={navigation.index} />
      <Footer
        mode={navigation.mode}
        onGoTo={navigation.goTo}
        onNext={navigation.next}
        onPrevious={navigation.previous}
        step={step}
        stepIndex={navigation.index}
        steps={steps}
      />
      <button data-presentation-mode-toggle="true" onClick={navigation.toggleMode} type="button">
        {navigation.mode === 'browse' ? 'Present' : 'Browse'}
      </button>
      <a
        data-presentation-attribution="true"
        href={attributionHref}
        style={{ bottom: 0, position: 'fixed', right: 0 }}
      >
        made by and-scene
      </a>
    </main>
  )
}
