import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import type { Mode, Step } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, width, height }: { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; width?: number; height?: number }) {
  if (!steps.length) throw new Error('A presentation requires at least one step')
  return <PresentationContent steps={steps} title={title} initialMode={initialMode} brand={brand} attribution={attribution} width={width} height={height} />
}
function PresentationContent<T>({ steps, title, initialMode, brand, attribution, width, height }: { steps: readonly Step<T>[]; title: string; initialMode: Mode; brand?: ReactNode; attribution?: ReactNode; width?: number; height?: number }) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  const step = steps[nav.index]
  return <main aria-label={title} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-step-id={step.id} data-step-era={step.era} data-step-title={step.title} data-step-caption={step.caption} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header step={step} index={nav.index} mode={nav.mode} brand={brand} />
    <button data-presentation-mode-toggle="" aria-label="Toggle presentation mode" onClick={nav.toggleMode} style={{ position: 'absolute', top: 0, right: 0 }}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    {nav.mode === 'browse' && viewport.width >= 1100 && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Stage step={step} mode={nav.mode} width={width} height={height} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} next={nav.next} prev={nav.prev} jump={nav.jump} />
    <div data-presentation-attribution-container="" style={{ position: 'absolute', bottom: 0, right: 0 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
