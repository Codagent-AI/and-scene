import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, type Mode } from './constants'
import { useFitScale } from './useFitScale'
import type { AnyStep } from './types'
import { sceneKey } from './sceneKey'

interface StageProps {
  step: AnyStep
  stepIndex: number
  mode: Mode
}

export function Stage({ step, stepIndex, mode }: StageProps) {
  const { ref, scale } = useFitScale(mode)
  const { Scene } = step
  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, position: 'relative' }}>
        <div
          data-presentation-canvas=""
          data-presentation-scale={scale.toFixed(3)}
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            position: 'absolute',
            top: 0,
            left: 0,
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
                exit={{ opacity: 0 }}
                transition={ENTER_T}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Scene payload={step.payload} meta={step} stepIndex={stepIndex} mode={mode} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
