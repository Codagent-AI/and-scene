import { useMemo } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { DESIGN_H, DESIGN_W } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps, Step } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', attribution, designWidth = DESIGN_W, designHeight = DESIGN_H, className, style }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index] as Step<T>
  const eras = useMemo(() => steps.reduce<{ era: string; index: number }[]>((result, item, index) => { if (!result.some((entry) => entry.era === item.era)) result.push({ era: item.era, index }); return result }, []), [steps])
  const credit = attribution ?? <a data-presentation-attribution href="https://github.com/and-scene/and-scene">made by and-scene</a>
  if (!step) return null
  return <main className={className} style={{ position: 'fixed', inset: 0, overflow: 'hidden', ...style }} data-presentation-root data-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}>
    <Header title={title} mode={nav.mode} />
    <Stage step={step} index={nav.index} total={steps.length} mode={nav.mode} width={designWidth} height={designHeight} touchHandlers={nav.touchHandlers} />
    {nav.mode === 'browse' && <Toc eras={eras} activeEra={step.era} onSelect={nav.goTo} />}
    <Footer title={step.title} caption={step.caption} mode={nav.mode} index={nav.index} count={steps.length} goTo={nav.goTo} prev={nav.prev} next={nav.next} attribution={credit} />
    <button type="button" data-presentation-mode-toggle aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} style={{ position: 'absolute', zIndex: 3, right: 24, top: 24 }} onClick={() => nav.setMode(nav.mode === 'browse' ? 'present' : 'browse')}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
