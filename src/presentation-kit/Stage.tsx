import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants.ts'
import { sceneKey } from './steps.ts'
import type { Canvas, Mode, Step } from './types.ts'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: Mode
  scale: number
  canvas?: Canvas
}

/**
 * Hosts the active step's scene on a fixed design canvas scaled uniformly to
 * fit. The scale is constant within a mode so layoutId morphs stay clean; a mode
 * switch remounts the group instead of morphing across geometries.
 */
export function Stage<TPayload>({
  step,
  index,
  mode,
  scale,
  canvas = { width: DESIGN_W, height: DESIGN_H },
}: StageProps<TPayload>) {
  const { Scene, payload } = step
  return (
    <div
      data-presentation-stage=""
      data-presentation-scale={scale}
      style={{ position: 'relative', flex: 'none', width: canvas.width * scale, height: canvas.height * scale }}
    >
      <LayoutGroup key={mode}>
        <motion.div
          layout
          transition={{ duration: 0 }}
          data-presentation-canvas=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: canvas.width,
            height: canvas.height,
            scale,
            originX: 0,
            originY: 0,
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            >
              <Scene payload={payload} index={index} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  )
}
