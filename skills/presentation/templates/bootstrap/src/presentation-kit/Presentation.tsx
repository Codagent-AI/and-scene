import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationOptions, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution }: PresentationOptions & { steps: Step<T>[] }) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <main data-presentation-root="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-step-id={steps[nav.index].id} data-step-era={steps[nav.index].era} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header title={title} mode={nav.mode} brand={brand} index={nav.index} toggle={nav.toggle} />
    <Stage step={steps[nav.index]} index={nav.index} mode={nav.mode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} next={nav.next} prev={nav.prev} />
    <aside data-presentation-attribution="" style={{ position: 'absolute', right: 16, bottom: 12 }}>{attribution ?? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</aside>
  </main>
}
