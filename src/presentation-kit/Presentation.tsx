import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import { useFitScale } from './useFitScale'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'

export interface PresentationProps<T> {
  steps: readonly Step<T>[]
  title: string
  initialMode?: Mode
  brand?: ReactNode
  attribution?: ReactNode
  width?: number
  height?: number
  className?: string
}
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, width, height, className }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { wide } = useFitScale(nav.mode)
  if (!steps.length) throw new Error('Presentation requires at least one step')
  const step = steps[nav.index]
  return <main className={className} data-presentation="" data-presentation-mode={nav.mode} data-step-era={step.era} data-step-count={steps.length} data-step-index={nav.index} style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} onTouchCancel={nav.onTouchCancel}>
    <Header step={step} index={nav.index} title={title} brand={brand} />
    <button data-presentation-mode-toggle="" aria-label="Toggle presentation mode" aria-pressed={nav.mode === 'present'} onClick={nav.toggleMode} style={{ position: 'absolute', top: 12, right: 24 }}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    <Stage step={step} stepIndex={nav.index} mode={nav.mode} width={width} height={height} />
    {nav.mode === 'browse' && <><Footer steps={steps} index={nav.index} next={nav.next} prev={nav.prev} jump={nav.jump} />{wide && <Toc steps={steps} index={nav.index} jump={nav.jump} />}</>}
    <div style={{ position: 'absolute', bottom: 8, right: 16 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
