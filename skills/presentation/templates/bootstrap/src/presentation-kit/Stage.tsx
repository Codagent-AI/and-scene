import { useId } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const { ref, scale } = useFitScale(mode, width, height)
  const id = useId()
  const Scene = step.Scene
  return <div ref={ref} data-presentation-stage="" style={{ position: 'relative', minHeight: 0, overflow: 'hidden' }}>
    <div data-presentation-canvas="" style={{ position: 'absolute', width, height, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})` }}>
      <LayoutGroup id={id}>
        <AnimatePresence initial={false}>
          <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }} style={{ position: 'absolute', inset: 0 }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
