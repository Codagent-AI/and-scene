import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

export interface StageProps {
  steps: Step[]
  stepIndex: number
  mode: PresentationMode
  designWidth?: number
  designHeight?: number
}

/**
 * Fixed design canvas, scaled uniformly to fit. Adjacent steps sharing a
 * `groupKey` render inside the same keyed node so the Scene component stays
 * mounted and only its `payload` prop changes; steps without a shared group
 * remount, and AnimatePresence cross-fades between them while any shared
 * `layoutId` entities still morph within the surrounding LayoutGroup.
 */
export function Stage({ steps, stepIndex, mode, designWidth = DESIGN_W, designHeight = DESIGN_H }: StageProps) {
  const { scale, containerRef } = useFitScale(mode, designWidth, designHeight)
  const step = steps[stepIndex]

  if (!step) return null

  const groupKey = step.groupKey ?? step.id
  const Scene = step.Scene

  return (
    <div
      className="presentation-stage"
      data-presentation-stage=""
      ref={containerRef}
      style={{
        display: 'flex',
        flex: '1 1 auto',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <div
        className="presentation-stage__viewport"
        data-presentation-stage-viewport=""
        style={{
          position: 'relative',
          width: designWidth * scale,
          height: designHeight * scale,
        }}
      >
        <div
          className="presentation-stage__canvas"
          data-presentation-stage-canvas=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: designWidth,
            height: designHeight,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={groupKey}
                className="presentation-stage__scene"
                data-presentation-scene={groupKey}
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Scene payload={step.payload} mode={mode} active stepIndex={stepIndex} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
