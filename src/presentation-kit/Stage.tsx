import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T } from './constants'
import { sceneKey } from './sceneKey'
import { useFitScale } from './useFitScale'
import type { CanvasSize, PresentationMode, Step } from './types'

interface StageProps<T> {
  step: Step<T>
  stepIndex: number
  mode: PresentationMode
  canvas?: CanvasSize
  /** Inset, in px, between the viewport edges and the stage area. */
  inset: { top: number; bottom: number; left: number; right: number }
}

/** Mounts the active step's scene inside the fixed, uniformly scaled canvas. */
export function Stage<T>({ step, stepIndex, mode, canvas, inset }: StageProps<T>) {
  const scale = useFitScale(mode, canvas)
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  const { Scene, payload } = step
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        ...inset,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: width * scale, height: height * scale, position: 'relative' }}>
        <div
          data-presentation-canvas=""
          data-presentation-scale={scale.toFixed(4)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width,
            height,
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
                exit={{ opacity: 0, transition: { duration: EXIT_T } }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Scene payload={payload} stepIndex={stepIndex} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
