import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useRef, useState, type TouchEvent } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { STAGE_LAYOUT } from './constants'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'
import { swipeAction } from './usePresentationNav'

interface Props<T> { step: Step<T>; index: number; mode: PresentationMode; onNext: () => void; onPrev: () => void }
export function Stage<T>({ step, index, mode, onNext, onPrev }: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(containerRef)
  const start = useRef<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const onTouchStart = (event: TouchEvent) => { start.current = event.touches[0]?.clientX ?? null; setTouchStart(start.current) }
  const onTouchEnd = (event: TouchEvent) => {
    const delta = (event.changedTouches[0]?.clientX ?? touchStart ?? 0) - (start.current ?? 0)
    const action = swipeAction(delta)
    if (action === 'next') onNext()
    else if (action === 'prev') onPrev()
    start.current = null; setTouchStart(null)
  }
  const key = step.groupKey ?? step.id
  const SceneComponent = step.Scene
  return <div ref={containerRef} data-presentation-stage data-presentation-mode={mode} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ position: 'relative', minHeight: 0, ...STAGE_LAYOUT[mode] }}>
    <div data-presentation-canvas style={{ position: 'absolute', left: '50%', top: '50%', width: DESIGN_W, height: DESIGN_H, transformOrigin: 'center', transform: `translate(-50%, -50%) scale(${scale})` }}>
      <LayoutGroup id="presentation">
        <AnimatePresence>
          <motion.div key={key} data-presentation-scene data-step-index={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <SceneComponent payload={step.payload} step={step} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
