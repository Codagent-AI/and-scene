import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE } from './constants'
import type { Step } from './types'

export interface StageProps<TPayload> {
  steps: Array<Step<TPayload>>
  stepIndex: number
  scale: number
}

/**
 * Fixed design canvas hosting the active step's Scene, wrapped in a
 * LayoutGroup + AnimatePresence so shared layoutId entities morph.
 *
 * Adjacent steps sharing a groupKey render the same keyed element, so the
 * Scene instance persists across the group and only its `payload` prop
 * changes; AnimatePresence only cross-fades when the render key changes.
 */
export function Stage<TPayload>({ steps, stepIndex, scale }: StageProps<TPayload>) {
  const step = steps[stepIndex]
  const renderKey = step.groupKey ?? step.id
  const Scene = step.Scene

  return (
    <div
      className="and-scene-stage"
      data-presentation-stage=""
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className="and-scene-stage-scaler"
        data-presentation-stage-scaler=""
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
      >
        <LayoutGroup>
          <AnimatePresence mode="wait">
            <motion.div
              key={renderKey}
              className="and-scene-canvas"
              data-presentation-canvas=""
              style={{ position: 'relative', width: DESIGN_W, height: DESIGN_H }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Scene payload={step.payload} stepId={step.id} stepIndex={stepIndex} isActive />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
