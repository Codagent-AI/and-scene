import type { ComponentType } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T, type Mode } from './constants'
import { useFitScale } from './useFitScale'
import { sceneKey } from './sceneKey'
import type { SceneProps, Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  mode: Mode
}

/** Fixed design canvas, scaled uniformly to fit, hosting the active step's scene. */
export function Stage<TPayload>({ step, stepIndex, mode }: StageProps<TPayload>) {
  const { scale, geometry } = useFitScale(mode)
  const Scene = step.Scene as ComponentType<SceneProps<TPayload | undefined>>
  return (
    <div
      data-presentation-stage=""
      data-presentation-scale={scale}
      style={{
        position: 'absolute',
        top: geometry.top,
        bottom: geometry.bottom,
        left: geometry.left,
        right: geometry.right,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, position: 'relative', flex: 'none' }}>
        <div
          data-presentation-canvas=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: EXIT_T } }}
                style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H }}
              >
                <Scene payload={step.payload} stepIndex={stepIndex} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
