import { useRef, type ComponentType } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import { useFitScale } from './useFitScale.ts'
import type { Canvas, Mode, SceneProps, Step } from './types.ts'

interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  mode: Mode
  canvas?: Canvas
}

/** Fixed design canvas, scaled to fit, hosting the active step's Scene. */
export function Stage<TPayload>({ step, stepIndex, mode, canvas }: StageProps<TPayload>) {
  const areaRef = useRef<HTMLDivElement>(null)
  const { width, height } = canvas ?? { width: DESIGN_W, height: DESIGN_H }
  const scale = useFitScale(areaRef, mode, { width, height })
  const Scene = step.Scene as ComponentType<SceneProps<TPayload>>

  return (
    <div
      ref={areaRef}
      data-presentation-stage=""
      style={{ position: 'relative', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene=""
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: EXIT_T } }}
            >
              <Scene payload={step.payload as TPayload} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
