import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

export function Stage<T>({ step, index, total, mode, onTouchStart, onTouchEnd }: { step: Step<T>; index: number; total: number; mode: PresentationMode; onTouchStart: (x: number) => void; onTouchEnd: (x: number) => void }) {
  const scale = useFitScale(mode)
  const Scene = step.Scene
  const grouped = step.groupKey
  const content = <Scene payload={step.payload} step={step} index={index} total={total} mode={mode} />
  return <div className="presentation-stage" data-presentation-stage onTouchStart={e => onTouchStart(e.touches[0]?.clientX ?? 0)} onTouchEnd={e => onTouchEnd(e.changedTouches[0]?.clientX ?? 0)}>
    <div className="presentation-canvas-frame" style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
      <div className="presentation-canvas" style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }} data-presentation-canvas>
        <LayoutGroup id="and-scene">
          {grouped ? <div key={grouped} data-presentation-scene-group={grouped}>{content}</div> : <AnimatePresence mode="wait"><motion.div key={step.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: LAYOUT_T }} exit={{ opacity: 0, transition: { duration: 0.18 } }} data-presentation-scene>{content}</motion.div></AnimatePresence>}
        </LayoutGroup>
      </div>
    </div>
  </div>
}
