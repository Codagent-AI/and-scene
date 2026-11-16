import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { Step } from './types'
export function Stage<T>({ step, hostKey, scale, height, inset, width = DESIGN_W, designHeight = DESIGN_H }: {
  step: Step<T>; hostKey: string; scale: number; height: number; inset: number; width?: number; designHeight?: number
}) {
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'relative', height, marginLeft: inset, display: 'grid', placeItems: 'center', touchAction: 'pan-y' }}>
    <div style={{ width: width * scale, height: designHeight * scale }}>
      <div data-presentation-canvas="" style={{ position: 'relative', width, height: designHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <LayoutGroup><AnimatePresence initial={false}>
          <motion.div key={hostKey} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }} style={{ position: 'absolute', inset: 0 }}>
            <Scene payload={step.payload} step={step} />
          </motion.div>
        </AnimatePresence></LayoutGroup>
      </div>
    </div>
  </div>
}
