import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { stepMarker } from './stepMarker'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'

export interface PresentationOptions {
  initialMode?: Mode
  title?: string
}

export function Presentation({
  steps,
  initialMode = 'browse',
  title = 'Presentation',
}: {
  steps: Step[]
  initialMode?: Mode
  title?: string
}) {
  const { step, setStep, next, prev, last, mode } = usePresentationNav(steps.length, initialMode)
  const current = steps[step]
  const marker = stepMarker(step)

  return (
    <div className="relative min-h-screen select-none overflow-hidden font-mono" data-presentation={title}>
      <div className="relative z-10 min-h-screen bg-bg">
        <Stage step={current} mode={mode} />
        <Header marker={marker} title={current.title} mode={mode} />
        {mode === 'browse' && <Toc steps={steps} step={step} onSelect={setStep} />}
        <Footer
          steps={steps}
          step={step}
          last={last}
          mode={mode}
          onPrev={prev}
          onNext={next}
          onSelect={setStep}
        />
      </div>
    </div>
  )
}
