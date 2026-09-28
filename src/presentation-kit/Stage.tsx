import { AnimatePresence, LayoutGroup, motion, useIsPresent } from 'motion/react'
import type { ComponentType } from 'react'
import { DESIGN_H, DESIGN_W, EASE } from './constants'
import type { SceneProps, Step } from './types'

export interface StageProps<TPayload> {
  steps: Array<Step<TPayload>>
  stepIndex: number
  scale: number
}

interface ActiveSceneProps<TPayload> {
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
  stepId: string
  stepIndex: number
}

/**
 * Derives `isActive` from AnimatePresence's presence state rather than a
 * literal `true`, so an outgoing scene knows it is exiting instead of
 * continuing to believe it is still active during its exit animation.
 */
function ActiveScene<TPayload>({ Scene, payload, stepId, stepIndex }: ActiveSceneProps<TPayload>) {
  const isPresent = useIsPresent()
  return <Scene payload={payload} stepId={stepId} stepIndex={stepIndex} isActive={isPresent} />
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
        style={{ position: 'relative', width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
      >
        <LayoutGroup>
          {/*
            mode="sync" keeps the outgoing and incoming canvases mounted at
            the same time (both absolutely positioned over the scaler) so
            entities sharing a layoutId across the two render keys can
            participate in the same layout projection and morph instead of
            fading out and back in.
          */}
          <AnimatePresence mode="sync">
            <motion.div
              key={renderKey}
              className="and-scene-canvas"
              data-presentation-canvas=""
              style={{ position: 'absolute', inset: 0, width: DESIGN_W, height: DESIGN_H }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <ActiveScene Scene={Scene} payload={step.payload} stepId={step.id} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
