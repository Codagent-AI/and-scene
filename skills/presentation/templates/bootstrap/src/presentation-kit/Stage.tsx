import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_T, EXIT_T } from './constants.ts'
import type { SlotProps } from './chrome/slots.ts'
import { sceneKey } from './sceneKey.ts'
import { useFitScale } from './useFitScale.ts'
import type { Canvas, Mode, Step } from './types.ts'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: Mode
  canvas?: Canvas
  viewportSlot?: SlotProps
  canvasSlot?: SlotProps
}

/** Fixed design canvas, scaled uniformly to its viewport, hosting the active step's Scene. */
export function Stage<TPayload>({ step, index, mode, canvas, viewportSlot, canvasSlot }: StageProps<TPayload>) {
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  const viewport = useRef<HTMLDivElement>(null)
  const scale = useFitScale(viewport, mode, width, height)
  const { Scene, payload, ...meta } = step
  return (
    <div
      ref={viewport}
      style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
      {...viewportSlot}
      data-presentation-stage=""
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
        {...canvasSlot}
        data-presentation-canvas=""
        data-presentation-scale={scale}
      >
        <LayoutGroup>
          <AnimatePresence>
            <motion.div
              key={sceneKey(step)}
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: ENTER_T, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
              data-presentation-scene=""
            >
              <Scene payload={payload} step={meta} index={index} mode={mode} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
