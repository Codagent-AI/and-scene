import { useMemo } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'
import { DESIGN_H, DESIGN_W } from './constants'

export function Presentation<T>({ steps, title, initialMode = 'browse', className = '', designWidth = DESIGN_W, designHeight = DESIGN_H, attribution }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  const sceneKey = useMemo(() => step?.groupKey ?? step?.id, [step])
  if (!step) return null
  return <main className={`presentation ${className}`} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-presentation-step-id={step.id} data-presentation-scene-key={sceneKey}>
    <Header title={title} mode={nav.mode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} designWidth={designWidth} designHeight={designHeight} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} />
    <Footer step={step} steps={steps} index={nav.index} mode={nav.mode} title={title} onPrev={nav.prev} onNext={nav.next} onGoTo={nav.goTo} attribution={attribution ?? null} />
    <button className="presentation-mode-toggle" type="button" data-presentation-mode-toggle="" onClick={nav.toggleMode} aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`}>P</button>
  </main>
}
