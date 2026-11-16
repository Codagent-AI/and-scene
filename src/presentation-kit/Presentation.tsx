import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', className, brand, designWidth, designHeight }: {
  steps: readonly Step<T>[]; title: string; initialMode?: Mode; className?: string; brand?: ReactNode; designWidth?: number; designHeight?: number
}) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { wide } = useFitScale(nav.mode)
  if (!steps.length) return <div role="alert">This presentation has no steps.</div>
  const step = steps[nav.index]
  return <main className={className} data-presentation-root="" data-presentation-mode={nav.mode} data-step-index={nav.index} data-step-count={steps.length} style={{ position: 'relative', width: '100%', height: '100dvh', minHeight: 440, overflow: 'hidden' }}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} />
    <Stage step={step} stepIndex={nav.index} mode={nav.mode} designWidth={designWidth} designHeight={designHeight} />
    {nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} prev={nav.prev} next={nav.next} goTo={nav.goTo} />
    <button data-presentation-mode-toggle="" aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggleMode} style={{ position: 'absolute', right: 24, top: 24 }}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" style={{ position: 'absolute', right: 24, bottom: 16 }}>made by and-scene</a>
  </main>
}
