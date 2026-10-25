import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T, STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
export function Stage<T>({ step, mode }: { step: Step<T>; mode: Mode }) {
  const scale = useFitScale(mode)
  const { Scene, payload } = step
  // Scene type participates in React reconciliation; a different component remounts even in the same group.
  // The canvas is centered by absolute offsets, not grid alignment: a grid track grows to the 880px canvas on narrow viewports and would anchor it left of center.
  return <div data-presentation-stage="" style={{ position: 'absolute', inset: `${STAGE_LAYOUT[mode].top}px 0 ${STAGE_LAYOUT[mode].bottom}px`, overflow: 'hidden' }}>
    <div data-presentation-canvas="" style={{ width: DESIGN_W, height: DESIGN_H, position: 'absolute', left: '50%', top: '50%', marginLeft: -DESIGN_W / 2, marginTop: -DESIGN_H / 2, transform: `scale(${scale})` }}>
      <LayoutGroup><AnimatePresence initial={false} mode="sync">
        <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}>
          <Scene payload={payload} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
