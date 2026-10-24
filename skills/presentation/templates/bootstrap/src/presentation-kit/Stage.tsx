import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, type Mode } from './constants'
import type { Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: Mode
  design?: { width: number; height: number }
}

export function Stage<TPayload>({ steps, index, mode, design }: StageProps<TPayload>) {
  const { ref, scale } = useFitScale(mode, design)
  const step = steps[index]
  const { Scene } = step
  const key = step.groupKey ?? step.id

  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{ position: 'relative', flex: '1 1 0', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: design?.width ?? DESIGN_W,
          height: design?.height ?? DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={key}
              data-presentation-scene=""
              data-presentation-scene-key={key}
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
            >
              <Scene payload={step.payload} stepIndex={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
