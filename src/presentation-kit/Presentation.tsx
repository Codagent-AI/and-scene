import type { ReactNode } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload = undefined> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  brand?: ReactNode
  attribution?: false | { label: string; href: string }
  className?: string
}

export function Presentation<TPayload = undefined>({ steps, title, initialMode = 'browse', brand, attribution = {
  label: 'made by and-scene', href: 'https://github.com/Codagent-AI/and-scene',
}, className }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const fit = useFitScale(nav.mode)
  if (!steps.length) throw new Error('A presentation requires at least one step.')

  return <main className={className} data-presentation-chrome data-presentation-mode={nav.mode}
    data-step-count={steps.length} data-step-index={nav.index} aria-label={title}
    style={{ position: 'relative', width: '100%', height: '100dvh' }} {...nav.touchHandlers}>
    <Stage steps={steps} index={nav.index} fit={fit} />
    <Header step={steps[nav.index]} index={nav.index} count={steps.length} mode={nav.mode} brand={brand} title={title} />
    {nav.mode === 'browse' && fit.wide && <Toc steps={steps} index={nav.index} jump={nav.jump} top={fit.top} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} prev={nav.prev} next={nav.next} left={fit.left} right={fit.right} />
    {attribution && <a data-presentation-attribution href={attribution.href} style={{ position: 'absolute', bottom: 8, right: 24 }}>{attribution.label}</a>}
  </main>
}
