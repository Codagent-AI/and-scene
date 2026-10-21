import type { ComponentType } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants'
import { sceneKey } from './sceneKey'
import type { Mode, SceneProps, Step } from './types'

export interface StageProps<T> {
  step: Step<T>
  stepIndex: number
  mode: Mode
  scale: number
}

/**
 * Fixed design canvas, scaled uniformly by `scale`, hosting the active step's Scene.
 * Same-group steps keep their Scene mounted (payload-only update); other changes
 * cross-fade while shared `layoutId` entities morph.
 */
export function Stage<T>({ step, stepIndex, mode, scale }: StageProps<T>) {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const Scene = step.Scene as ComponentType<SceneProps<T>>
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top,
        bottom,
        left: side,
        right: side,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{ position: 'relative', width: DESIGN_W * scale, height: DESIGN_H * scale, flex: 'none' }}
      >
        <div
          data-presentation-design=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T }}
                style={{ position: 'absolute', inset: 0 }}
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
