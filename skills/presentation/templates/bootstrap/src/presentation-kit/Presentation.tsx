import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import { useFitScale } from './useFitScale'
import type { PresentationProps } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, designWidth, designHeight }: PresentationProps<T>) {
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <PresentationBody steps={steps} title={title} initialMode={initialMode} brand={brand} attribution={attribution} designWidth={designWidth} designHeight={designHeight} />
}
function PresentationBody<T>({ steps, title, initialMode, brand, attribution, designWidth, designHeight }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { wide } = useFitScale(nav.mode)
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header title={title} brand={brand} mode={nav.mode} toggle={nav.toggle} />
    {nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <Stage step={steps[nav.index]} mode={nav.mode} designWidth={designWidth} designHeight={designHeight} />
    <Footer steps={steps} {...nav} />
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', right: 20, bottom: 12 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
