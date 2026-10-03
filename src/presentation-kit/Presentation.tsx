import { useRef } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', attribution = true, brand }: PresentationProps<T>) {
  const groupScenes = new Map<string, PresentationProps<T>['steps'][number]['Scene']>()
  for (const item of steps) {
    if (!item.groupKey) continue
    const existing = groupScenes.get(item.groupKey)
    if (existing && existing !== item.Scene) throw new Error(`Steps in scene group "${item.groupKey}" must use the same Scene component.`)
    groupScenes.set(item.groupKey, item.Scene)
  }
  const nav = usePresentationNav(steps.length, initialMode)
  const touchStart = useRef(0)
  const step = steps[nav.index]
  if (steps.length === 0) return <main className="presentation" data-presentation data-presentation-empty role="status">This presentation has no steps.</main>
  if (!step) return <main className="presentation" data-presentation data-presentation-empty role="status">This presentation has no active step.</main>
  return <main className="presentation" data-presentation data-presentation-mode={nav.mode}>
    <Header title={title} step={step} index={nav.index} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage step={step} index={nav.index} total={steps.length} mode={nav.mode} onTouchStart={x => { touchStart.current = x }} onTouchEnd={x => { const delta = x - touchStart.current; if (Math.abs(delta) > 48) { if (delta < 0) nav.next(); else nav.prev() } }} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} title={title} next={nav.next} prev={nav.prev} goTo={nav.goTo} toggleMode={nav.toggleMode} attribution={attribution} />
  </main>
}
