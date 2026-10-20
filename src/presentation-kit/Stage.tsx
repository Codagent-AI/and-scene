import type { ComponentType } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, SCENE_FADE_T, STAGE_LAYOUT } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import type { PresentationMode, SceneProps, Step } from './types.ts'

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: PresentationMode
  scale: number
}

export function Stage<TPayload>({ step, index, mode, scale }: StageProps<TPayload>) {
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const Scene = step.Scene as ComponentType<SceneProps<TPayload>>
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top,
        bottom,
        left: side,
        right: side,
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
          width: DESIGN_W,
          height: DESIGN_H,
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
              transition={SCENE_FADE_T}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={step.payload} stepIndex={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
