import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, Step } from './types'
import type { ComponentType } from 'react'

const sceneTypeIds = new WeakMap<ComponentType<never>, number>()
let nextSceneTypeId = 0

function getSceneTypeId(Scene: ComponentType<never>) {
  let id = sceneTypeIds.get(Scene)
  if (id === undefined) {
    id = nextSceneTypeId++
    sceneTypeIds.set(Scene, id)
  }
  return id
}

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: PresentationMode
  designWidth?: number
  designHeight?: number
}

export function Stage<TPayload>({ steps, index, mode, designWidth = DESIGN_W, designHeight = DESIGN_H }: StageProps<TPayload>) {
  const step = steps[index]
  const scale = useFitScale(mode, designWidth, designHeight)
  if (!step) return null
  const Scene = step.Scene
  const scene = <Scene payload={step.payload} step={step} index={index} />
  const groupKey = step.groupKey ? `${step.groupKey}:${getSceneTypeId(Scene as ComponentType<never>)}` : step.id

  return (
    <div className="presentation-stage" data-presentation-stage="">
      <div
        className="presentation-canvas"
        data-presentation-canvas=""
        style={{ width: designWidth, height: designHeight, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={groupKey}
              className="presentation-scene"
              data-presentation-scene=""
              data-step-id={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {scene}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
