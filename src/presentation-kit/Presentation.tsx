import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand }: { steps: Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode }) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  if (!step) throw new Error('A presentation requires at least one step')
  return <main data-presentation-root="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    <Stage step={step} mode={nav.mode} />
    {nav.mode === 'browse' && <><Toc steps={steps} index={nav.index} jump={nav.jump} /><Footer steps={steps} index={nav.index} jump={nav.jump} next={nav.next} prev={nav.prev} /></>}
    <a data-presentation-attribution="" style={{ position: 'absolute', bottom: 0, right: 0 }} href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>
  </main>
}
