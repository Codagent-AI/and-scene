import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution = true, width, height }: { steps: Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: boolean; width?: number; height?: number }) {
  if (steps.length === 0) throw new Error('Presentation requires at least one step')
  return <PresentationHost steps={steps} title={title} initialMode={initialMode} brand={brand} attribution={attribution} width={width} height={height} />
}
function PresentationHost<T>({ steps, title, initialMode, brand, attribution, width, height }: { steps: Step<T>[]; title: string; initialMode: Mode; brand?: ReactNode; attribution: boolean; width?: number; height?: number }) {
  const nav = usePresentationNav(steps.length, initialMode)
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} {...nav.touch} style={{ position: 'relative', height: '100dvh', display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', overflow: 'hidden' }}>
    <Header step={steps[nav.index]} index={nav.index} title={title} mode={nav.mode} brand={brand} toggle={nav.toggle} />
    <Stage step={steps[nav.index]} mode={nav.mode} width={width} height={height} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} next={nav.next} prev={nav.prev} />
    <style>{'@media(min-width:1101px){[data-presentation-mode="browse"] [data-presentation-stage]{margin-inline:140px}}@media(max-width: 1100px){[data-presentation-toc]{display:none!important}}'}</style>
    {nav.mode === 'browse' && <div style={{ position: 'absolute', left: 0, top: '25%' }}><Toc steps={steps} index={nav.index} jump={nav.jump} /></div>}
    {attribution && <a data-presentation-attribution="" style={{ position: 'absolute', right: 0, bottom: 0 }} href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}
  </main>
}
