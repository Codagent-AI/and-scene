import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useRef, type TouchEvent } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps, Step } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', designSize, className, style, attribution }: PresentationProps<TPayload>) {
  const { index, mode, setMode, go, next, prev } = usePresentationNav(steps.length, initialMode)
  const step = steps[index]
  const size = designSize ?? { width: DESIGN_W, height: DESIGN_H }
  const scale = useFitScale(size.width, size.height, mode)
  const touchX = useRef<number | null>(null)
  const onTouchStart = (event: TouchEvent) => { touchX.current = event.touches[0]?.clientX ?? null }
  const onTouchEnd = (event: TouchEvent) => {
    if (touchX.current === null) return
    const delta = event.changedTouches[0]!.clientX - touchX.current
    if (Math.abs(delta) > 48) {
      if (delta < 0) next()
      else prev()
    }
    touchX.current = null
  }
  if (!step) return null
  const showBrowse = mode === 'browse'
  const eras = [...new Set(steps.map((item) => item.era))]
  const attributionNode = attribution === undefined ? <a data-presentation-attribution="" href="https://github.com/and-scene/and-scene">made by and-scene</a> : attribution
  return <main className={className} style={{ position: 'relative', minHeight: '100vh', ...style }} data-presentation-root="" data-mode={mode} data-step-count={steps.length} data-step-index={index} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <header data-presentation-header="">
      <span data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
      <h1 data-presentation-title="">{showBrowse ? title : step.title}</h1>
    </header>
    {showBrowse && <nav aria-label="Presentation sections" data-presentation-toc="">
      {eras.map((era) => {
        const active = step.era === era
        return <button key={era} type="button" aria-current={active ? 'location' : undefined} data-presentation-toc-item="" data-presentation-active={String(active)} onClick={() => go(steps.findIndex((item) => item.era === era))}>{era}</button>
      })}
    </nav>}
    <section aria-label="Presentation scene" data-presentation-stage="" style={{ width: size.width * scale, height: size.height * scale, margin: 'auto' }}>
      <div style={{ width: size.width, height: size.height, transform: `scale(${scale})`, transformOrigin: 'top left' }} data-presentation-canvas="">
        <LayoutGroup id="and-scene">
          <AnimatePresence mode="wait" initial={false}>
            <SceneHost key={step.groupKey ?? step.id} step={step} index={index} />
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
    {showBrowse && <footer data-presentation-footer="">
      <p data-presentation-caption="">{step.caption}</p>
      <nav aria-label="Step progress" data-presentation-progress="">
        {steps.map((item, i) => <button key={item.id} type="button" aria-label={`${item.title}, step ${i + 1}`} aria-current={i === index ? 'step' : undefined} data-presentation-progress-item="" data-presentation-active={String(i === index)} onClick={() => go(i)}>{i + 1}</button>)}
      </nav>
      <button type="button" onClick={prev} disabled={index === 0} aria-label="Previous step">Previous</button>
      <button type="button" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
    </footer>}
    <button type="button" aria-label={`Switch to ${showBrowse ? 'present' : 'browse'} mode`} data-presentation-mode-toggle="" onClick={() => setMode(showBrowse ? 'present' : 'browse')}>{showBrowse ? 'Present' : 'Browse'}</button>
    {attributionNode && <div style={{ position: 'fixed', right: 16, bottom: 12 }} data-presentation-attribution-slot="">{attributionNode}</div>}
  </main>
}

function SceneHost<TPayload>({ step, index }: { step: Step<TPayload>; index: number }) {
  const Scene = step.scene
  return <div data-presentation-scene="" data-step-id={step.id}><Scene payload={step.payload} step={index} /></div>
}
