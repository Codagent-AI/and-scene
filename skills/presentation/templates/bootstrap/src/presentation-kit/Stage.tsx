import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { DESIGN_H, DESIGN_W, EXIT_T } from './constants'
import { sceneKey } from './scene-key'
import { dataHooks, type DataHooks } from './nodes/geometry'
import type { Canvas, Mode, SceneProps, Step } from './types'

interface StageProps<TPayload> extends DataHooks {
  step: Step<TPayload>
  index: number
  scale: number
  mode: Mode
  canvas?: Canvas
  className?: string
  style?: CSSProperties
}

export function Stage<TPayload>({ step, index, scale, mode, canvas, className, style, ...hooks }: StageProps<TPayload>) {
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  const { Scene, payload, ...meta } = step
  const props: SceneProps<TPayload> = { payload, step: meta, index }
  return (
    <div
      {...dataHooks(hooks)}
      data-presentation-stage=""
      data-presentation-mode={mode}
      className={className}
      style={{ position: 'relative', width: width * scale, height: height * scale, ...style }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Keyed by mode: a mode switch remounts the scene instead of morphing entities across the geometry change. */}
        <LayoutGroup key={mode}>
          <AnimatePresence>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene=""
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: EXIT_T } }}
            >
              <Scene {...props} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
