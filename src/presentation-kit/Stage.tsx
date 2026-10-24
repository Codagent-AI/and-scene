import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_T, EXIT_T, type Mode } from './constants'
import { useFitScale } from './useFitScale'
import { sceneKey } from './steps'
import type { AnyStep } from './types'

export interface StageProps {
  step: AnyStep
  index: number
  mode: Mode
  /** Design canvas size; defaults to 880 × 380. */
  canvas?: { width: number; height: number }
}

/**
 * Fixed design canvas scaled uniformly to the space between header and footer.
 * Steps sharing a group and Scene keep one instance (only `payload` changes);
 * other transitions cross-fade while shared `layoutId` entities morph.
 */
export function Stage({ step, index, mode, canvas = { width: DESIGN_W, height: DESIGN_H } }: StageProps) {
  const { scale, inset } = useFitScale(mode, canvas)
  const { Scene } = step
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top: inset.top,
        bottom: inset.bottom,
        left: inset.left,
        right: inset.right,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        layout
        transition={{ duration: 0 }}
        style={{ position: 'relative', flex: 'none', width: canvas.width, height: canvas.height, scale }}
      >
        <LayoutGroup>
          <AnimatePresence>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: ENTER_T, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
              style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
            >
              <Scene payload={step.payload} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  )
}
