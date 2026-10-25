import type { ReactNode } from 'react'
import { DEFAULT_ATTRIBUTION_URL, WIDE_VIEWPORT } from './constants'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import type { Mode, Step } from './types'

export interface PresentationProps<T> {
  steps: readonly Step<T>[]
  title: string
  initialMode?: Mode
  brand?: ReactNode
  attribution?: false | { label?: string; href?: string }
  className?: string
  designWidth?: number
  designHeight?: number
}
export function Presentation<T>(props: PresentationProps<T>) {
  if (!props.steps.length) throw new Error('Presentation requires at least one step')
  return <PresentationHost {...props} />
}
function PresentationHost<T>({ steps, title, initialMode = 'browse', brand, attribution, className, designWidth, designHeight }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const fit = useFitScale(nav.mode)
  const wide = fit.width + fit.left + 24 >= WIDE_VIEWPORT
  const step = steps[nav.index]
  return <main aria-label={title} className={className} data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-presentation-step-id={step.id} data-presentation-step-caption={step.caption} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
    <Header mode={nav.mode} step={step} index={nav.index} brand={brand} />
    <Stage step={step} mode={nav.mode} designWidth={designWidth} designHeight={designHeight} />
    {nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} next={nav.next} prev={nav.prev} jump={nav.jump} />
    <button data-presentation-mode-toggle="" aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggle} style={{ position: 'absolute', right: 24, top: 24 }}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    {attribution !== false && <a data-presentation-attribution="" href={attribution?.href ?? DEFAULT_ATTRIBUTION_URL} style={{ position: 'absolute', bottom: 12, right: 24 }}>{attribution?.label ?? 'made by and-scene'}</a>}
  </main>
}
