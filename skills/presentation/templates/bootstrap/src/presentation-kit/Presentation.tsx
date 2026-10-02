import { useMemo } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', designWidth, designHeight, brand, attribution, className, onStepChange }: PresentationProps<T>) {
  if (!steps.length) throw new Error('Presentation requires at least one step.')
  const nav = usePresentationNav(steps.length, initialMode, onStepChange)
  const step = steps[nav.index]
  const sections = useMemo(() => steps.flatMap((item, index, all) => index === 0 || item.section !== all[index - 1].section ? [{ section: item.section, index }] : []), [steps])
  return <main className={['presentation', className].filter(Boolean).join(' ')} data-presentation data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} {...nav.touchHandlers}>
    <Header title={title} mode={nav.mode} brand={brand} onToggleMode={nav.toggleMode} />
    <Stage step={step} index={nav.index} total={steps.length} mode={nav.mode} designWidth={designWidth} designHeight={designHeight} />
    {nav.mode === 'browse' && <Toc sections={sections} activeIndex={nav.index} onSelect={nav.goTo} />}
    <Footer step={step} index={nav.index} total={steps.length} mode={nav.mode} onSelect={nav.goTo} onPrev={nav.prev} onNext={nav.next} />
    {attribution === false ? null : attribution ?? <a className="presentation-attribution" data-presentation-attribution href="https://github.com/and-scene/and-scene">made by and-scene</a>}
  </main>
}
