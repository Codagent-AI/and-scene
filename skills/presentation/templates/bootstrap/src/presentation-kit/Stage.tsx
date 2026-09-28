import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'
import type { Step } from './types'

interface StageProps<T> { step: Step<T>; index: number; scale: number; width?: number; height?: number }

export function Stage<T>({ step, index, scale, width = DESIGN_W, height = DESIGN_H }: StageProps<T>) {
  const Scene = step.Scene
  const layoutScope = useId()
  return <div className="presentation-stage" data-presentation-stage="" style={{ width: width * scale, height: height * scale }}>
    <motion.div className="presentation-canvas" data-presentation-canvas="" style={{ width, height, scale, transformOrigin: 'top left' }}>
      <LayoutGroup id={layoutScope}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={step.groupKey ?? step.id} className="presentation-scene" data-presentation-scene=""
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }}>
            <Scene payload={step.payload} step={step} index={index} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </motion.div>
  </div>
}
