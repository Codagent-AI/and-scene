import { useMemo, useRef } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { Stage } from './Stage'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', designSize, className, renderBrand, attribution }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const current = steps[nav.index]
  const scale = useFitScale(designSize?.width ?? DESIGN_W, designSize?.height ?? DESIGN_H, nav.mode)
  const touchStart = useRef<number | null>(null)
  const eras = useMemo(() => [...new Set(steps.map((step) => step.era))], [steps])
  if (!current) return null
  return <main className={`presentation presentation--${nav.mode}${className ? ` ${className}` : ''}`} data-presentation-root="" data-mode={nav.mode}
    data-step-count={steps.length} data-step-index={nav.index}>
    <header className="presentation-header" data-presentation-header="">
      <div className="presentation-brand" data-presentation-brand="">{renderBrand}</div>
      <div className="presentation-heading">{nav.mode === 'browse' && <h1 data-presentation-title="">{title}</h1>}
        <div className="presentation-mode-tools"><span data-presentation-marker="">{String(nav.index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
          <button type="button" data-presentation-mode-toggle="" aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggleMode}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button></div>
      </div>
    </header>
    {nav.mode === 'browse' && <nav className="presentation-toc" data-presentation-toc="" aria-label="Table of contents">
      {eras.map((era) => { const first = steps.findIndex((step) => step.era === era); const active = steps[nav.index]?.era === era
        return <button type="button" key={era} onClick={() => nav.goTo(first)} aria-current={active ? 'step' : undefined} data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'}>{era}</button> })}
    </nav>}
    <section className="presentation-viewport" data-presentation-viewport="" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null }} onTouchEnd={(event) => {
      if (touchStart.current === null) return
      const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
      if (Math.abs(delta) > 48) {
        if (delta < 0) nav.next()
        else nav.prev()
      }
      touchStart.current = null
    }}>
      <Stage step={current} index={nav.index} scale={scale} width={designSize?.width} height={designSize?.height} />
    </section>
    <footer className="presentation-footer" data-presentation-footer="">
      <div className="presentation-narration">{nav.mode === 'present' ? <strong data-presentation-present-title="">{current.title}</strong> : <><strong data-presentation-step-title="">{current.title}</strong><p data-presentation-caption="">{current.caption}</p></>}</div>
      {nav.mode === 'browse' && <div className="presentation-navigation">
        <button type="button" onClick={nav.prev} disabled={nav.index === 0} aria-label="Previous step" data-presentation-prev="">Previous</button>
        <div className="presentation-progress" data-presentation-progress="" role="group" aria-label="Presentation steps">{steps.map((step, index) => <button key={step.id} type="button" aria-label={`Go to step ${index + 1}: ${step.title}`} aria-current={index === nav.index ? 'step' : undefined} data-presentation-step="" data-presentation-active={index === nav.index ? 'true' : 'false'} onClick={() => nav.goTo(index)}><span className="presentation-visually-hidden">{index + 1}</span></button>)}</div>
        <button type="button" onClick={nav.next} disabled={nav.index === steps.length - 1} aria-label="Next step" data-presentation-next="">Next</button>
      </div>}
    </footer>
    <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/and-scene" target="_blank" rel="noreferrer">{attribution ?? 'made by and-scene'}</a>
  </main>
}
