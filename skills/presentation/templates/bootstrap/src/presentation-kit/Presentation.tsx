import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import type { Mode, Step } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', brand }: {
  steps: readonly Step<TPayload>[]; title: string; initialMode?: Mode; brand?: ReactNode
}) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { width } = useViewport()
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <main data-presentation="" data-step-count={steps.length} data-step-index={nav.index}
    data-mode={nav.mode} {...nav.touch} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', touchAction: 'pan-y' }}>
    {nav.mode === 'browse' && <Header title={title} brand={brand} />}
    {nav.mode === 'browse' && width >= 1000 && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <Stage step={steps[nav.index]} mode={nav.mode} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} next={nav.next} prev={nav.prev} />
    <button data-presentation-mode="" type="button" onClick={nav.toggle}
      style={{ position: 'absolute', top: 24, right: 32 }} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene"
      style={{ position: 'absolute', bottom: 14, right: 32 }}>made by and-scene</a>
  </main>
}
