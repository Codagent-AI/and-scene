import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useRef } from 'react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import { stageKey } from './stageKey'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  mode: Mode
  canvasWidth?: number
  canvasHeight?: number
}

/** Fixed design canvas, uniformly scaled to fit, hosting the active step's scene. */
export function Stage<TPayload>({ step, mode, canvasWidth = DESIGN_W, canvasHeight = DESIGN_H }: StageProps<TPayload>) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFitScale(ref, mode, canvasWidth, canvasHeight)
  const Scene = step.Scene
  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div data-presentation-canvas="" style={{ position: 'relative', width: canvasWidth * scale, height: canvasHeight * scale }}>
        <div
          data-presentation-canvas-inner=""
          style={{ position: 'absolute', left: 0, top: 0, width: canvasWidth, height: canvasHeight, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={stageKey(step)}
                data-presentation-scene=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: LAYOUT_T, ease: EASE }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Scene payload={step.payload} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
