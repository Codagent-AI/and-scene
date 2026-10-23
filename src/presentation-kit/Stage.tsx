import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { hostKey } from './hostKey'
import { DESIGN_H, DESIGN_W } from './constants'
import { EXIT_TRANSITION } from './motion'
import type { SceneProps, Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  scale: number
  designWidth?: number
  designHeight?: number
}

export function Stage<TPayload>({ step, index, scale, designWidth = DESIGN_W, designHeight = DESIGN_H }: StageProps<TPayload>) {
  const { Scene } = step
  const sceneProps: SceneProps<TPayload> = { payload: step.payload, step, index }
  return (
    <div
      data-presentation-stage=""
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{
          position: 'relative',
          flex: 'none',
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence>
            <motion.div
              key={hostKey(step)}
              data-presentation-scene=""
              exit={{ opacity: 0, transition: EXIT_TRANSITION }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene {...sceneProps} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
