import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
export function Stage<T>({ step, mode, designW = DESIGN_W, designH = DESIGN_H }: { step: Step<T>; mode: Mode; designW?: number; designH?: number }) {
  const scale = useFitScale(mode, designW, designH), id = useId()
  const { Scene } = step
  return <div data-presentation-stage="" style={{ position: 'absolute', top: STAGE_LAYOUT[mode].top, bottom: STAGE_LAYOUT[mode].bottom, left: 0, right: 0, display: 'grid', placeItems: 'center' }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width: designW, height: designH, transform: `scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup id={id}><AnimatePresence initial={false}>
        <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Scene payload={step.payload} step={step} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
