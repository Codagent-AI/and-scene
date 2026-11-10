import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import type { Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const [wide, setWide] = useState(() => window.innerWidth >= 1100)
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1100)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!steps.length) throw new Error('A presentation needs at least one step')
  const step = steps[nav.index], browse = nav.mode === 'browse'
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} onTouchCancel={nav.onTouchCancel}>
    <Header step={step} index={nav.index} title={title} browse={browse} brand={brand} toggle={nav.toggle} />
    <Stage step={step} mode={nav.mode} />
    {browse && <Toc steps={steps} index={nav.index} jump={nav.jump} wide={wide} />}
    <Footer steps={steps} index={nav.index} browse={browse} jump={nav.jump} prev={nav.prev} next={nav.next} />
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', bottom: 12, right: 16 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
