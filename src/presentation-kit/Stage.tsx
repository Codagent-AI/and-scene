import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'
import { sceneKey } from './nav'
import { stageInsets, useFitScale } from './useFitScale'
import type { AnyStep, PresentationMode } from './types'

export interface StageProps {
  step: AnyStep
  stepIndex: number
  mode: PresentationMode
  designW?: number
  designH?: number
}

export function Stage({ step, stepIndex, mode, designW = DESIGN_W, designH = DESIGN_H }: StageProps) {
  const { scale, viewportW } = useFitScale(mode, designW, designH)
  const g = stageInsets(mode, viewportW)
  const Scene = step.scene
  return (
    <div
      data-presentation-stage-area=""
      style={{ position: 'absolute', top: g.top, bottom: g.bottom, left: g.left, right: g.side }}
    >
      <div
        data-presentation-stage=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: designW,
          height: designH,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
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
              transition={{ duration: ENTER_T }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={step.payload} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
