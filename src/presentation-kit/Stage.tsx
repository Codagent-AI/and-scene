import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
export function Stage<T>({ step, scale, designW = DESIGN_W, designH = DESIGN_H }: { step: Step<T>; scale: number; designW?: number; designH?: number }) {
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ width: designW * scale, height: designH * scale, position: 'relative' }}>
    <div data-presentation-canvas="" style={{ width: designW, height: designH, position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup><AnimatePresence initial={false}>
        <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}>
          <Scene payload={step.payload} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
