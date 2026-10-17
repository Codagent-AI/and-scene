import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants.ts'
import { sceneKey } from './sections.ts'
import type { Mode, Step } from './types.ts'
import { useFitScale } from './useFitScale.ts'

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: Mode
}

export function Stage<TPayload>({ step, index, mode }: StageProps<TPayload>) {
  const { ref, scale } = useFitScale(mode)
  const key = sceneKey(step)
  const { Scene } = step

  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{ flex: '1 1 0', minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        layout
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: DESIGN_W,
          height: DESIGN_H,
          x: '-50%',
          y: '-50%',
          scale,
          originX: 0.5,
          originY: 0.5,
        }}
      >
        <LayoutGroup>
          <AnimatePresence>
            <motion.div
              key={key}
              data-presentation-scene={key}
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
            >
              <Scene payload={step.payload as TPayload} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  )
}
