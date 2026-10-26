import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; designW?: number; designH?: number }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, designW, designH }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (!steps.length) throw new Error('A presentation requires at least one step')
  const step = steps[nav.index]
  return <main aria-label={title} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-step-id={step.id} data-step-era={step.era} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header step={step} index={nav.index} mode={nav.mode} brand={brand} toggle={nav.toggle} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <Stage step={step} mode={nav.mode} designW={designW} designH={designH} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} next={nav.next} prev={nav.prev} />
    <div data-presentation-attribution-container="" style={{ position: 'absolute', bottom: 12, right: 20 }}>{attribution === undefined ? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>
    <style>{'[data-presentation-toc]{display:none}@media(min-width:1100px){[data-presentation-toc]{display:flex}}'}</style>
  </main>
}
