import { AnimatePresence, LayoutGroup, motion, useIsPresent } from 'motion/react'
import type { ComponentType, CSSProperties } from 'react'
import { DESIGN_H, DESIGN_W, EASE } from './constants'
import type { SceneProps, Step } from './types'

export interface StageProps<TPayload> {
  steps: Array<Step<TPayload>>
  stepIndex: number
  scale: number
  /** Layout placement for the stage box (e.g. the gap between chrome bands). */
  style?: CSSProperties
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
export function Stage<TPayload>({ steps, stepIndex, scale, style }: StageProps<TPayload>) {
  const step = steps[stepIndex]
  const renderKey = step.groupKey ?? step.id
  const Scene = step.Scene

  return (
    <div
      className="and-scene-stage"
      data-presentation-stage=""
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
    >
      {/*
        A transform scales only what is painted, so negative (or positive)
        margins shrink (or grow) the scaler's layout footprint to the scaled
        canvas size; otherwise the unscaled 880px box overflows narrow
        viewports and misreports its height to surrounding layout.
      */}
      <div
        className="and-scene-stage-scaler"
        data-presentation-stage-scaler=""
        style={{
          position: 'relative',
          flexShrink: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          margin: `${(DESIGN_H * scale - DESIGN_H) / 2}px ${(DESIGN_W * scale - DESIGN_W) / 2}px`,
          transform: `scale(${scale})`,
        }}
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
