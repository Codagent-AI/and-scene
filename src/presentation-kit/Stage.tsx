import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'
import type { AnyStep, PresentationMode } from './types'

export interface StageProps {
  steps: AnyStep[]
  activeIndex: number
  mode: PresentationMode
}

/**
 * Hosts the fixed DESIGN_W x DESIGN_H canvas, uniformly scaled to fit, and
 * renders the active step's Scene. Steps sharing a groupKey keep the same
 * React key across navigation, so the Scene instance persists and only its
 * payload changes; otherwise the host cross-fades via AnimatePresence while
 * entities sharing a layoutId still morph across the swap.
 */
export function Stage({ steps, activeIndex, mode }: StageProps) {
  const scale = useFitScale(mode)
  const step = steps[activeIndex]
  const hostKey = step?.groupKey ?? step?.id

  return (
    <div
      data-presentation-stage-viewport="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        data-presentation-stage="true"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          position: 'relative',
          flex: '0 0 auto',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup id="and-scene-stage">
          <AnimatePresence mode="popLayout" initial={false}>
            {step ? (
              <motion.div
                key={hostKey}
                data-presentation-node="scene-host"
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <step.Scene payload={step.payload} active />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
