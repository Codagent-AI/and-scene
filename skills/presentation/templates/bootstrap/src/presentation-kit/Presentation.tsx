import { useMemo, useRef } from 'react'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', branding, className }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const step = steps[nav.index]
  const eras = useMemo(() => steps.reduce<{ era: string; index: number }[]>((list, item, index) => {
    if (!list.some(({ era }) => era === item.era)) list.push({ era: item.era, index })
    return list
  }, []), [steps])
  if (!step) return null
  const browsing = nav.mode === 'browse'
  const touchStart = (event: React.TouchEvent) => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }
  const touchEnd = (event: React.TouchEvent) => {
    if (!touch.current) return
    const dx = event.changedTouches[0].clientX - touch.current.x
    const dy = event.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nav.next()
      else nav.prev()
    }
    touch.current = null
  }
  return <main className={`presentation ${className ?? ''}`} data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} onTouchStart={touchStart} onTouchEnd={touchEnd}>
    <header className="presentation-header" data-presentation-header="">
      <div className="presentation-brand">{branding}</div>
      <div className="presentation-heading"><span data-presentation-marker="">{step.era} · {String(nav.index + 1).padStart(2, '0')}</span>{browsing && <strong>{title}</strong>}</div>
      <button type="button" data-presentation-mode-toggle="" aria-label={`Switch to ${browsing ? 'present' : 'browse'} mode`} onClick={nav.toggleMode}>{browsing ? 'Present' : 'Browse'}</button>
    </header>
    <Stage step={step} mode={nav.mode} />
    <footer className="presentation-footer" data-presentation-footer="">
      <div className="presentation-narration"><strong>{step.title}</strong>{browsing && <p>{step.caption}</p>}</div>
      {browsing && <>
        <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">{eras.map(({ era, index }) => <button key={era} type="button" aria-current={step.era === era ? 'location' : undefined} data-presentation-active={step.era === era ? '' : undefined} onClick={() => nav.goTo(index)}>{era}</button>)}</nav>
        <nav className="presentation-progress" aria-label="Step navigation" data-presentation-progress="">{steps.map((item, index) => <button key={item.id} type="button" aria-label={`${index + 1}: ${item.title}`} aria-current={index === nav.index ? 'step' : undefined} data-presentation-active={index === nav.index ? '' : undefined} onClick={() => nav.goTo(index)} />)}</nav>
        <div className="presentation-controls"><button type="button" onClick={nav.prev} disabled={nav.index === 0}>Previous</button><button type="button" onClick={nav.next} disabled={nav.index === steps.length - 1}>Next</button></div>
      </>}
      <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/and-scene/and-scene">made by and-scene</a>
    </footer>
  </main>
}
