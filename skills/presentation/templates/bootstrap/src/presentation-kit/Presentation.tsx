import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import type { Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; designW?: number; designH?: number }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, designW, designH }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <main data-presentation-root="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}
    style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <Header title={title} mode={nav.mode} brand={brand} toggle={nav.toggle} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Stage step={steps[nav.index]} mode={nav.mode} designW={designW} designH={designH} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} next={nav.next} prev={nav.prev} />
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', right: 20, bottom: 16 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
