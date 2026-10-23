import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_ANIMATE, STAGE_LAYOUT, type Mode } from './constants'
import { sceneKey } from './sceneKey'
import type { Canvas, Step } from './types'
import { useFitScale } from './useFitScale'

const FILL = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } as const

export interface StageProps<TPayload> {
  step: Step<TPayload>
  mode: Mode
  canvas?: Canvas
}

/** Fixed design canvas, uniformly scaled, hosting the active step's scene. */
export function Stage<TPayload>({ step, mode, canvas }: StageProps<TPayload>) {
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  const scale = useFitScale(mode, { width, height })
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const Scene = step.Scene
  return (
    <div
      data-presentation-stage
      style={{
        position: 'absolute',
        left: side,
        right: side,
        top,
        bottom,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-presentation-canvas
        data-presentation-scale={scale}
        style={{
          position: 'relative',
          flex: 'none',
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene
              data-presentation-step={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={EXIT_ANIMATE}
              style={FILL}
            >
              <Scene payload={step.payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
