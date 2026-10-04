import { useRef, type PointerEvent } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', designSize = { width: DESIGN_W, height: DESIGN_H }, attribution }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const scale = useFitScale(nav.mode, designSize.width, designSize.height)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  if (steps.length === 0) return <main className="presentation" data-presentation="" data-presentation-mode={nav.mode} data-step-count="0" data-step-index="0" />
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => { pointer.current = { x: event.clientX, y: event.clientY } }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointer.current) return
    const dx = event.clientX - pointer.current.x
    const dy = event.clientY - pointer.current.y
    pointer.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) nav.next()
      else nav.prev()
    }
  }
  return <main className="presentation" data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}>
    <Header title={title} mode={nav.mode} onToggleMode={nav.toggleMode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} onSelect={nav.goTo} />}
    <div className="presentation-stage-host" data-presentation-stage-host="" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <Stage step={steps[nav.index]} index={nav.index} scale={scale} width={designSize.width} height={designSize.height} />
    </div>
    <Footer steps={steps} index={nav.index} mode={nav.mode} title={title} onSelect={nav.goTo} onPrev={nav.prev} onNext={nav.next} attribution={attribution} />
  </main>
}
