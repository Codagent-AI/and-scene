import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import type { CanvasSize, Step } from './types.ts'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  scale: number
  canvas?: CanvasSize
}

/** Fixed design canvas, uniformly scaled, hosting the active step's Scene. */
export function Stage<TPayload>({
  step,
  stepIndex,
  scale,
  canvas = { width: DESIGN_W, height: DESIGN_H },
}: StageProps<TPayload>) {
  const { Scene } = step
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'relative',
          flex: 'none',
          width: canvas.width,
          height: canvas.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene=""
              data-presentation-scene-key={sceneKey(step)}
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Scene payload={step.payload} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
