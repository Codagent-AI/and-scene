import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { SceneProps, Step } from './types'
import { SceneLayer } from './nodes/SceneLayer'

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  scale: number
  width?: number
  height?: number
}

export function Stage<TPayload>({ step, index, scale, width = DESIGN_W, height = DESIGN_H }: StageProps<TPayload>) {
  const CurrentScene = step.Scene
  const sceneProps: SceneProps<TPayload> = { payload: step.payload, step, index }
  const sceneKey = step.groupKey ?? step.id
  return (
    <div className="presentation-stage" data-presentation-stage="" style={{ width: width * scale, height: height * scale }}>
      <div className="presentation-stage__canvas" data-presentation-canvas="" style={{ width, height, transform: `scale(${scale})` }}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={sceneKey} className="presentation-stage__scene" data-presentation-scene="" style={{ width, height }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}>
              <SceneLayer>
                <CurrentScene {...sceneProps} />
              </SceneLayer>
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
