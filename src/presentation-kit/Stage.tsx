import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EXIT_T, STAGE_LAYOUT, TOC_MIN_WIDTH, TOC_WIDTH } from './constants.ts'
import type { Mode } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import type { AnyStep } from './types.ts'
import { useFitScale } from './useFitScale.ts'
import { useViewport } from './useViewport.ts'

interface StageProps {
  step: AnyStep
  stepIndex: number
  mode: Mode
}

export function Stage({ step, stepIndex, mode }: StageProps) {
  const scale = useFitScale(mode)
  const { width } = useViewport()
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const tocSpace = mode === 'browse' && width >= TOC_MIN_WIDTH ? TOC_WIDTH : 0
  const { Scene, payload } = step

  return (
    <div
      data-presentation-stage
      style={{
        position: 'absolute',
        top,
        bottom,
        left: side + tocSpace,
        right: side,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        data-presentation-canvas
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'relative',
          flex: 'none',
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene={step.groupKey ?? step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: ENTER_T } }}
              exit={{ opacity: 0, transition: { duration: EXIT_T } }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={payload} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
