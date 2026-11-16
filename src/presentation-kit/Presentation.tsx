import type { ReactNode } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { sceneKey } from './model'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; designWidth?: number; designHeight?: number }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, designWidth, designHeight }: PresentationProps<T>) {
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <PresentationBody steps={steps} title={title} initialMode={initialMode} brand={brand} attribution={attribution} designWidth={designWidth} designHeight={designHeight} />
}
function PresentationBody<T>({ steps, title, initialMode, brand, attribution, designWidth, designHeight }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const fit = useFitScale(nav.mode, designWidth, designHeight)
  const step = steps[nav.index]
  return <main aria-label={title} data-presentation-root="" data-presentation-mode={nav.mode} data-presentation-compact={fit.compact ? 'true' : 'false'} data-step-count={steps.length} data-step-index={nav.index} data-step-id={step.id} data-step-era={step.era} style={{ position: 'relative', minHeight: '100svh' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <div style={{ height: fit.layout.header }}><Header step={step} index={nav.index} mode={nav.mode} brand={brand} toggle={nav.toggle} /></div>
    {nav.mode === 'browse' && fit.wide && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Stage step={step} hostKey={sceneKey(steps, nav.index)} {...fit} width={designWidth} designHeight={designHeight} />
    <div data-presentation-footer-slot="" style={{ minHeight: fit.layout.footer }}><Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} next={nav.next} prev={nav.prev} /></div>
    <div data-presentation-attribution-slot="" style={{ position: 'absolute', bottom: 8, right: 12 }}>{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
