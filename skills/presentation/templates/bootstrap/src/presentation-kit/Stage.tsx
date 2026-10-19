import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, EXIT_T, GROUP_FADE_T } from './constants'
import { sceneKey } from './sceneKey'
import { useFitScale } from './useFitScale'
import type { Canvas, Mode, Step } from './types'

const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }

export interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: Mode
  canvas?: Canvas
}

/** Fixed design canvas, scaled uniformly to fit, hosting the active step's scene. */
export function Stage<TPayload>({ step, index, mode, canvas = DEFAULT_CANVAS }: StageProps<TPayload>) {
  const region = useRef<HTMLDivElement>(null)
  const scale = useFitScale(region, canvas, mode)
  const { Scene } = step

  return (
    <div
      ref={region}
      data-presentation-stage=""
      style={{ position: 'relative', flex: '1 1 0', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: canvas.width,
          height: canvas.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup id="presentation-stage">
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene={step.groupKey ?? step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: GROUP_FADE_T, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={step.payload} stepIndex={index} mode={mode} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
