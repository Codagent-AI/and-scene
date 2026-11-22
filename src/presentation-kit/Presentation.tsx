import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import type { Mode, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution = true, width, height }: { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: boolean | ReactNode; width?: number; height?: number }) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  if (!steps.length) return <p data-presentation-empty="">This presentation has no steps.</p>
  const step = steps[nav.index]
  return <main data-presentation="" data-step-index={nav.index} data-step-count={steps.length} data-presentation-mode={nav.mode} style={{ position: 'relative', width: '100%', height: '100dvh', minHeight: 480, overflow: 'hidden' }}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} />
    <Stage step={step} mode={nav.mode} width={width} height={height} />
    {nav.mode === 'browse' && viewport.width >= 1000 && <div style={{ position: 'absolute', right: 28, top: 24 }}><Toc steps={steps} index={nav.index} go={nav.go} /></div>}
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} prev={nav.prev} next={nav.next} />
    <button data-presentation-mode-toggle="" onClick={nav.toggleMode} style={{ position: 'absolute', bottom: 20, left: 28 }}>{nav.mode === 'browse' ? 'Present' : 'Browse'} <span aria-hidden="true">↗</span></button>
    {attribution && <div style={{ position: 'absolute', bottom: 22, right: 28 }}>{attribution === true ? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>}
  </main>
}
