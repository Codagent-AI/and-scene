import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step, Mode } from './types'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const { scale } = useFitScale(mode, width, height)
  const g = STAGE_LAYOUT[mode]
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'absolute', top: g.top, bottom: g.bottom, left: g.left, right: g.right, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: width * scale, height: height * scale }}><div data-presentation-canvas="" style={{ position: 'relative', width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup><AnimatePresence initial={false} mode="sync"><motion.div key={step.groupKey ?? step.id} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Scene payload={step.payload} step={step} /></motion.div></AnimatePresence></LayoutGroup>
    </div></div>
  </div>
}
