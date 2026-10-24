import { useEffect, useMemo } from 'react'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { validateSteps } from './steps'
import { usePresentationNav } from './usePresentationNav'
import { useWide } from './useWide'
import type { PresentationProps } from './types'

/** Composes the stage, chrome, and navigation for an ordered list of steps. */
export function Presentation<TPayload>({
  steps,
  title,
  initialMode,
  brand,
  attribution,
  className,
}: PresentationProps<TPayload>) {
  useMemo(() => validateSteps(steps), [steps])
  const { index, mode, goTo, next, prev, toggleMode } = usePresentationNav(steps.length, initialMode)
  const wide = useWide()
  useEffect(() => {
    if (title) document.title = title
  }, [title])
  const step = steps[index]

  return (
    <div
      className={className}
      data-presentation-root
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      data-step-id={step.id}
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}
    >
      <Header
        step={step}
        index={index}
        count={steps.length}
        mode={mode}
        brand={brand}
        onToggleMode={toggleMode}
      />
      <div data-presentation-main style={{ flex: '1 1 0', minHeight: 0, display: 'flex' }}>
        {mode === 'browse' && wide && <Toc steps={steps} index={index} onGoTo={goTo} />}
        <Stage key={mode} steps={steps} index={index} mode={mode} />
      </div>
      <Footer steps={steps} index={index} mode={mode} onGoTo={goTo} onPrev={prev} onNext={next} />
      {attribution !== false && <Attribution {...attribution} />}
    </div>
  )
}
