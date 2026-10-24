import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ENTER_T } from './constants'
import { sceneKey } from './sceneKey'
import type { Canvas, Mode, SceneProps, Step } from './types'
import { stageBox, useFitScale } from './useFitScale'
import { useViewport } from './useViewport'

export interface StageProps<P> {
  step: Step<P>
  index: number
  mode: Mode
  canvas: Canvas
}

export function Stage<P>({ step, index, mode, canvas }: StageProps<P>) {
  const scale = useFitScale(mode, canvas)
  const box = stageBox(mode, useViewport())
  const sceneProps: SceneProps<P> = { payload: step.payload, step, index }
  const Scene = step.Scene
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top: box.top,
        bottom: box.bottom,
        left: box.side,
        right: box.side,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{
          position: 'relative',
          flex: 'none',
          width: canvas.width,
          height: canvas.height,
          transform: `scale(${scale})`,
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
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            >
              <Scene {...sceneProps} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
