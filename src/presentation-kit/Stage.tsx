import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, EXIT_T, ENTER_T, STAGE_LAYOUT } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import type { Canvas, Mode, Step } from './types.ts'

interface StageProps<TPayload> {
  step: Step<TPayload>
  mode: Mode
  scale: number
  showSide: boolean
  canvas?: Canvas
}

export function Stage<TPayload>({
  step,
  mode,
  scale,
  showSide,
  canvas = { width: DESIGN_W, height: DESIGN_H },
}: StageProps<TPayload>) {
  const g = STAGE_LAYOUT[mode]
  const Scene = step.Scene
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top: g.top,
        bottom: g.bottom,
        left: showSide ? g.side : 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: canvas.width * scale,
          height: canvas.height * scale,
        }}
      >
        <motion.div
          data-presentation-canvas=""
          data-presentation-scale={scale}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: canvas.width,
            height: canvas.height,
            originX: 0,
            originY: 0,
            scale,
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                data-presentation-step-id={step.id}
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: ENTER_T, ease: EASE } }}
                exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
              >
                <Scene payload={step.payload} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </div>
    </div>
  )
}
