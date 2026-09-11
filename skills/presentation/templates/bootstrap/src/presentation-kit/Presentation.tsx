import { useMemo } from 'react'
import { Stage } from './Stage.tsx'
import { Footer, Header, Toc } from './chrome/index.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import type { IndexedStep, PresentationProps } from './types.ts'

const ATTRIBUTION_HREF = 'https://github.com/openai/and-scene'

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution,
  className,
  style,
}: PresentationProps<TPayload>) {
  const indexedSteps = useMemo<IndexedStep<TPayload>[]>(
    () => steps.map((step, index) => ({ ...step, index })),
    [steps],
  )
  const navigation = usePresentationNav({ stepCount: indexedSteps.length, initialMode })
  const activeStep = indexedSteps[navigation.stepIndex] ?? indexedSteps[0]

  if (!activeStep) {
    return <main className={className} style={style} data-presentation data-mode={navigation.mode}>No steps</main>
  }

  return (
    <main
      className={className}
      style={style}
      data-presentation
      data-testid="presentation"
      data-mode={navigation.mode}
      {...navigation.touchHandlers}
    >
      <div
        className="presentation-chrome"
        data-testid="presentation-chrome"
        data-step-count={indexedSteps.length}
        data-step-index={navigation.stepIndex}
      >
        <Header
          title={title}
          step={activeStep}
          stepCount={indexedSteps.length}
          mode={navigation.mode}
          brand={brand}
          onToggleMode={navigation.toggleMode}
        />
        <Toc
          steps={indexedSteps}
          activeIndex={navigation.stepIndex}
          onGoToStep={navigation.goToStep}
          hidden={navigation.mode === 'present'}
        />
        <Footer
          steps={indexedSteps}
          activeIndex={navigation.stepIndex}
          mode={navigation.mode}
          onGoToStep={navigation.goToStep}
          onNext={navigation.next}
          onPrev={navigation.prev}
        />
      </div>
      <Stage step={activeStep} mode={navigation.mode} />
      {attribution === false ? null : (
        <div className="presentation-attribution" data-presentation-attribution>
          {attribution ?? (
            <a href={ATTRIBUTION_HREF}>
              made by and-scene
            </a>
          )}
        </div>
      )}
    </main>
  )
}
