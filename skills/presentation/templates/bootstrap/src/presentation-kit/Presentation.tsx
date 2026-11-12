import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { fitScale, useViewport } from './useFitScale'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; className?: string; brand?: ReactNode; attribution?: ReactNode }
export function Presentation<T>({ steps, title, initialMode = 'browse', className, brand, attribution }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { width, height } = useViewport(), scale = fitScale(width, height, nav.mode)
  if (!steps.length) return <p role="alert">This presentation has no steps.</p>
  const step = steps[nav.index]
  return <main className={className} aria-label={title} data-presentation-root="" data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}>
    <Header step={step} index={nav.index} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    {nav.mode === 'browse' && width >= 1100 && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <div data-presentation-stage-container="" style={{ display: 'flex', justifyContent: 'center' }}><Stage step={step} scale={scale} /></div>
    {nav.mode === 'browse' && <Footer steps={steps} index={nav.index} jump={nav.jump} next={nav.next} prev={nav.prev} />}
    <div style={{ position: 'fixed', right: 16, bottom: 12 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
