import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useViewport } from './useFitScale'
import type { PresentationOptions, Step } from './types'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, className }: PresentationOptions & { steps: readonly Step<T>[] }) {
  const nav = usePresentationNav(steps.length, initialMode), { width } = useViewport()
  if (!steps.length) throw new Error('A presentation needs at least one step')
  const step = steps[nav.index]
  return <main className={className} aria-label={title} data-presentation-root="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-step-id={step.id} data-step-era={step.era} style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden' }} {...nav.touch}>
    <Header title={step.title} marker={`${String(nav.index + 1).padStart(2, '0')} / ${steps.length} · ${step.era}`} brand={brand} />
    {nav.mode === 'browse' && width >= 1100 && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Stage step={step} mode={nav.mode} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} next={nav.next} prev={nav.prev} jump={nav.jump} />
    <button data-presentation-mode-toggle="" onClick={nav.toggleMode} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" style={{ position: 'absolute', right: 16, bottom: 12 }}>made by and-scene</a>
  </main>
}
