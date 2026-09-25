import { useMemo, useRef, useState } from 'react'
import Stage from './Stage'
import { DESIGN_H, DESIGN_W } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps, Step } from './types'

export default function Presentation<T>({ steps, title, initialMode = 'browse', designWidth = DESIGN_W, designHeight = DESIGN_H, className = '', style, branding, attribution }: PresentationProps<T>) {
  const { index, mode, goTo, next, prev, toggleMode } = usePresentationNav(steps.length, initialMode)
  const step = steps[index]
  const touch = useRef<{ x: number; y: number } | null>(null)
  const eras = useMemo(() => steps.reduce<{ era: string; index: number }[]>((all, current, i) => {
    if (!all.some((entry) => entry.era === current.era)) all.push({ era: current.era, index: i })
    return all
  }, []), [steps])
  const [tocOpen, setTocOpen] = useState(false)
  return <main className={`presentation presentation--${mode} ${className}`} style={{ position: 'fixed', inset: 0, ...style }} data-presentation="" data-presentation-mode={mode} data-step-count={steps.length} data-step-index={index} onTouchStart={(event) => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }} onTouchEnd={(event) => {
    if (!touch.current) return
    const dx = event.changedTouches[0].clientX - touch.current.x
    const dy = event.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
    }
    touch.current = null
  }}>
    <header className="presentation-header" data-presentation-header=""><div data-presentation-brand="">{branding}</div>{mode === 'browse' ? <h1 data-presentation-title="">{title}</h1> : <div data-presentation-marker=""><span>{String(index + 1).padStart(2, '0')}</span><h1>{step.title}</h1></div>}<button type="button" data-presentation-mode-toggle="" onClick={toggleMode} aria-label={`Switch to ${mode === 'browse' ? 'present' : 'browse'} mode`}>{mode === 'browse' ? 'Present' : 'Browse'}</button></header>
    <Stage steps={steps} index={index} mode={mode} width={designWidth} height={designHeight} />
    <footer className="presentation-footer" data-presentation-footer="">
      {mode === 'browse' ? <><p data-presentation-caption="">{step.caption}</p><nav aria-label="Presentation progress" data-presentation-progress="">{steps.map((item, i) => <button type="button" key={item.id} data-presentation-progress-item="" data-presentation-active={i === index ? 'true' : 'false'} aria-current={i === index ? 'step' : undefined} aria-label={`Go to step ${i + 1}: ${item.title}`} onClick={() => goTo(i)}>{i + 1}</button>)}</nav><button type="button" data-presentation-prev="" onClick={prev} disabled={index === 0}>Previous</button><button type="button" data-presentation-next="" onClick={next} disabled={index === steps.length - 1}>Next</button><button type="button" data-presentation-toc-toggle="" onClick={() => setTocOpen((open) => !open)} aria-expanded={tocOpen}>Contents</button>{(tocOpen || window.innerWidth >= 900) && <nav aria-label="Table of contents" data-presentation-toc="">{eras.map(({ era, index: eraIndex }) => <button type="button" key={era} data-presentation-toc-item="" data-presentation-active={steps[index].era === era ? 'true' : 'false'} aria-current={steps[index].era === era ? 'location' : undefined} onClick={() => goTo(eraIndex)}>{era}</button>)}</nav>}</> : <div data-presentation-present-title="">{step.title}</div>}
      {attribution === false ? null : <div data-presentation-attribution="">{attribution ?? <a href="https://github.com/and-scene/and-scene">made by and-scene</a>}</div>}
    </footer>
  </main>
}

export type { Step }
