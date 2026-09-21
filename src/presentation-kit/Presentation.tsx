import { useState } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', className, style }: PresentationProps<TPayload>) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const step = steps[index]
  const nav = usePresentationNav({ index, count: steps.length, mode, setIndex, setMode })
  if (!step) return null
  return (
    <main className={className} style={style} data-presentation-root data-presentation-mode={mode} data-step-count={steps.length} data-step-index={index} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
      <Header step={step} index={index} mode={mode} title={title} />
      <button type="button" data-presentation-mode-toggle onClick={nav.toggleMode}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
      {mode === 'browse' && <Toc steps={steps} index={index} onJump={setIndex} />}
      <Stage step={step} mode={mode} />
      <Footer steps={steps} index={index} mode={mode} onJump={setIndex} onPrevious={nav.previous} onNext={nav.next} />
    </main>
  )
}
