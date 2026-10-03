import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import Stage from './Stage'
import { DESIGN_H, DESIGN_W } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps, Step } from './types'

const WIDE_QUERY = '(min-width: 900px)'
const SWIPE_MIN_PX = 50

export default function Presentation<T>({ steps, title, initialMode = 'browse', designWidth = DESIGN_W, designHeight = DESIGN_H, className = '', style, branding, attribution }: PresentationProps<T>) {
  const { index, mode, goTo, next, prev, toggleMode } = usePresentationNav(steps.length, initialMode)
  const step = steps[index]
  const touch = useRef<{ x: number; y: number } | null>(null)
  const eras = useMemo(() => steps.reduce<{ era: string; index: number }[]>((all, current, i) => {
    if (!all.some((entry) => entry.era === current.era)) all.push({ era: current.era, index: i })
    return all
  }, []), [steps])
  const [tocOpen, setTocOpen] = useState(false)
  const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY)
    const update = () => setWide(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const rootStyle = { position: 'fixed', inset: 0, ...style } as const
  if (!step) return <main className={`presentation ${className}`} style={rootStyle}>No presentation steps available.</main>

  const onTouchEnd = (event: TouchEvent) => {
    if (!touch.current) return
    const dx = event.changedTouches[0].clientX - touch.current.x
    const dy = event.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) <= SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) next()
    else prev()
  }

  return <main className={`presentation presentation--${mode} ${className}`} style={rootStyle} data-presentation="" data-presentation-mode={mode} data-step-count={steps.length} data-step-index={index} data-step-title={step.title} data-step-caption={step.caption} onTouchStart={(event) => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }} onTouchEnd={onTouchEnd}>
    <header className="presentation-header" data-presentation-header="">
      <div data-presentation-brand="">{branding}</div>
      {mode === 'browse'
        ? <h1 data-presentation-title="">{title}</h1>
        : <div data-presentation-marker=""><span>{String(index + 1).padStart(2, '0')}</span><h1>{step.title}</h1></div>}
      <button type="button" data-presentation-mode-toggle="" onClick={toggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button>
    </header>
    <Stage steps={steps} index={index} mode={mode} width={designWidth} height={designHeight} />
    <footer className="presentation-footer" data-presentation-footer="">
      {mode === 'browse' ? <>
        <p data-presentation-caption="">{step.caption}</p>
        <nav aria-label="Presentation progress" data-presentation-progress="">
          {steps.map((item, i) => {
            const active = i === index
            return <button type="button" key={item.id} data-presentation-progress-item="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} aria-label={`Go to step ${i + 1}: ${item.title}`} onClick={() => goTo(i)}>{i + 1}</button>
          })}
        </nav>
        <button type="button" data-presentation-prev="" onClick={prev} disabled={index === 0}>Previous</button>
        <button type="button" data-presentation-next="" onClick={next} disabled={index === steps.length - 1}>Next</button>
        <button type="button" data-presentation-toc-toggle="" onClick={() => setTocOpen((open) => !open)} aria-expanded={tocOpen}>Contents</button>
        {(tocOpen || wide) && <nav aria-label="Table of contents" data-presentation-toc="">
          {eras.map(({ era, index: eraIndex }) => {
            const active = step.era === era
            return <button type="button" key={era} data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'location' : undefined} onClick={() => goTo(eraIndex)}>{era}</button>
          })}
        </nav>}
      </> : <div data-presentation-present-title="">{step.title}</div>}
      {attribution === false ? null : <div data-presentation-attribution="">{attribution ?? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>}
    </footer>
  </main>
}

export type { Step }
