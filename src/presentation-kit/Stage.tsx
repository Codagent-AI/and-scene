import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T } from './constants'
import type { Canvas, Mode, SceneProps, Step } from './types'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneId(Scene: object): number {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    id = nextSceneId++
    sceneIds.set(Scene, id)
  }
  return id
}

/** Steps with the same key share one mounted scene; otherwise the presence host swaps scenes. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  return step.groupKey ? `group:${step.groupKey}:${sceneId(step.Scene)}` : `step:${step.id}`
}

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  scale: number
  mode: Mode
  canvas?: Canvas
}

export function Stage<TPayload>({ step, index, scale, mode, canvas }: StageProps<TPayload>) {
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  const { Scene, payload, ...meta } = step
  const props: SceneProps<TPayload> = { payload, step: meta, index }
  return (
    <div
      data-presentation-stage=""
      data-presentation-mode={mode}
      style={{ position: 'relative', width: width * scale, height: height * scale }}
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
        <LayoutGroup>
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
