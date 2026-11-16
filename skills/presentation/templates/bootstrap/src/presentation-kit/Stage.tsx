import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const scale = useFitScale(mode, width, height)
  const Scene = step.Scene
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: geometry.side, right: geometry.side, display: 'grid', placeItems: 'center' }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width, height, flexShrink: 0, transform: `scale(${scale})` }}>
      <LayoutGroup><AnimatePresence initial={false}>
        <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }} style={{ position: 'absolute', inset: 0 }}>
          <Scene payload={step.payload} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
