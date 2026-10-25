import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_T } from './constants.ts'
import { DEFAULT_CANVAS, type CanvasSize } from './fit.ts'
import { sceneKey } from './sceneKey.ts'
import { useFitScale } from './useFitScale.ts'
import type { AnyStep, Mode } from './types.ts'

interface StageProps {
  step: AnyStep
  index: number
  mode: Mode
  canvas?: CanvasSize
}

/** Fixed design canvas, scaled uniformly to fit, hosting the active step's scene. */
export function Stage({ step, index, mode, canvas = DEFAULT_CANVAS }: StageProps) {
  const { ref, scale } = useFitScale(mode, canvas)
  const { Scene } = step
  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{ position: 'relative', flex: '1 1 0', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: canvas.width || DESIGN_W,
          height: canvas.height || DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene=""
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T, ease: EASE }}
            >
              <Scene payload={step.payload} index={index} mode={mode} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
