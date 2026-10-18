import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, STEP_FADE_T } from './constants'
import type { Fit } from './fit'
import { sceneKey } from './sceneKey'
import type { SceneProps, Step } from './types'

interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  fit: Fit
}

export function Stage<TPayload>({ step, stepIndex, fit }: StageProps<TPayload>) {
  const { Scene, payload } = step
  const props: SceneProps<TPayload> = { payload, stepIndex }
  return (
    <div
      data-presentation-canvas=""
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: DESIGN_W,
        height: DESIGN_H,
        transformOrigin: '0 0',
        transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`,
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
            transition={{ duration: STEP_FADE_T, ease: EASE }}
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
          >
            <Scene {...props} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}
