import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import type { Mode, Step } from './types'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; width?: number; height?: number }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, width, height }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  if (!steps.length) throw new Error('Presentation needs at least one step')
  const step = steps[nav.index]
  return <main aria-label={title} data-presentation="" data-presentation-mode={nav.mode} data-step-era={step.era} data-step-count={steps.length} data-step-index={nav.index} {...nav.touch} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header step={step} index={nav.index} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    {nav.mode === 'browse' && viewport.width >= 1000 && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Stage step={step} mode={nav.mode} width={width} height={height} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} prev={nav.prev} next={nav.next} />
    <div data-presentation-attribution="" style={{ position: 'absolute', right: 18, bottom: 12 }}>{attribution === undefined ? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>
  </main>
}
