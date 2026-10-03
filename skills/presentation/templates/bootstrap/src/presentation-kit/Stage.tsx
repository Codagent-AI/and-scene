import { AnimatePresence, LayoutGroup, motion, useIsPresent } from 'motion/react'
import { useRef } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { useFitScale } from './useFitScale'
import type { AnyStep } from './types'

export interface StageProps {
  steps: AnyStep[]
  activeIndex: number
}

interface SceneHostProps {
  step: AnyStep
}

/**
 * Renders one step's Scene, deriving `active` from AnimatePresence's own
 * presence state rather than a constant. While a host is exiting (its step
 * navigated away but AnimatePresence is still playing the exit animation),
 * `active` is false so the outgoing Scene can stop timers/media/handlers
 * instead of continuing to run alongside the incoming one.
 */
function SceneHost({ step }: SceneHostProps) {
  const isPresent = useIsPresent()
  return (
    <motion.div
      data-presentation-node="scene-host"
      style={{ position: 'absolute', inset: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <step.Scene payload={step.payload} active={isPresent} />
    </motion.div>
  )
}

/**
 * Hosts the fixed DESIGN_W x DESIGN_H canvas, uniformly scaled to fit its
 * actual available space, and renders the active step's Scene. Steps sharing
 * a groupKey keep the same React key across navigation, so the Scene instance
 * persists and only its payload changes; otherwise the host cross-fades via
 * AnimatePresence while entities sharing a layoutId still morph across the
 * swap.
 */
export function Stage({ steps, activeIndex }: StageProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const scale = useFitScale(viewportRef)
  const step = steps[activeIndex]
  const hostKey = step?.groupKey ?? step?.id

  return (
    <div
      ref={viewportRef}
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
            {step ? <SceneHost key={hostKey} step={step} /> : null}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
