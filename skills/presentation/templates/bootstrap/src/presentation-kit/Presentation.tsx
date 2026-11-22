import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import type { Mode, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, canvas }: {
  steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; canvas?: { width: number; height: number }
}) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-index={nav.index} data-step-count={steps.length} aria-label={title} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    {nav.mode === 'browse' && viewport.width >= 1100 && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} width={canvas?.width} height={canvas?.height} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} prev={nav.prev} next={nav.next} />
    <div data-presentation-attribution="" style={{ position: 'absolute', right: 16, bottom: 12 }}>{attribution === undefined ? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>
  </main>
}
