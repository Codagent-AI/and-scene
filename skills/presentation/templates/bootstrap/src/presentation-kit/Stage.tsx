import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<T> {
  steps: readonly Step<T>[]
  index: number
  mode: Mode
}

/** Hosts the active step's scene on the fixed design canvas, scaled to fit. */
export function Stage<T>({ steps, index, mode }: StageProps<T>) {
  const { ref, scale } = useFitScale(mode)
  const step = steps[index]
  if (!step) return null
  const { Scene } = step
  // Steps sharing a group key keep one scene instance; otherwise scenes cross-fade.
  const sceneKey = step.groupKey ?? step.id

  return (
    <div
      ref={ref}
      data-presentation-stage=""
      data-presentation-scale={scale.toFixed(3)}
      style={{ position: 'relative', flex: '1 1 0', minHeight: 0, minWidth: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey}
              data-presentation-scene=""
              data-presentation-scene-key={sceneKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={step.payload} stepIndex={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
