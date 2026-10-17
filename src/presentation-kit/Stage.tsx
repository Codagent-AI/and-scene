import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T } from './constants'
import { hostKey } from './steps'
import type { Canvas, Mode, SceneStep } from './types'
import { useFitScale } from './useFitScale'

export interface StageProps {
  step: SceneStep
  mode: Mode
  canvas?: Canvas
}

/**
 * Fixed design canvas scaled to fit. Steps with equal host keys keep one scene instance;
 * otherwise the outgoing step fades while shared `layoutId` entities morph into the new one.
 */
export function Stage({ step, mode, canvas }: StageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFitScale(ref, mode, canvas)
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <motion.div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width,
          height,
          x: '-50%',
          y: '-50%',
          scale,
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={hostKey(step)}
              data-presentation-step-host=""
              exit={{ opacity: 0, transition: { duration: EXIT_T } }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {step.render()}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  )
}
