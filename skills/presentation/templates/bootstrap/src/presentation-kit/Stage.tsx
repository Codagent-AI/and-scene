import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, Step } from './types'

interface StageProps<T> {
  step: Step<T>
  index: number
  total: number
  mode: PresentationMode
  width: number
  height: number
  className?: string
}

export function Stage<T>({ step, index, total, mode, width, height, className }: StageProps<T>) {
  const scale = useFitScale(width, height, mode)
  const Scene = step.Scene
  return <div className={['presentation-stage', className].filter(Boolean).join(' ')} data-presentation-stage="" data-mode={mode}>
    <div className="presentation-stage-viewport" style={{ width: width * scale, height: height * scale }}>
      <motion.div className="presentation-stage-canvas" style={{ width, height, scale, transformOrigin: 'top left' }} data-presentation-canvas="">
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div key={step.groupKey ?? `step:${step.id}`} className="presentation-scene-host" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Scene payload={step.payload} step={step} index={index} total={total} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  </div>
}

export { DESIGN_W, DESIGN_H }
