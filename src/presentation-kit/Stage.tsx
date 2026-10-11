import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, Step } from './types'

type Props<T> = { step: Step<T>; index: number; mode: PresentationMode; designSize?: { width: number; height: number } }
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 1

function sceneIdentity(scene: object) {
  let id = sceneIds.get(scene)
  if (!id) { id = nextSceneId++; sceneIds.set(scene, id) }
  return id
}

export function Stage<T>({ step, index, mode, designSize }: Props<T>) {
  const width = designSize?.width ?? DESIGN_W
  const height = designSize?.height ?? DESIGN_H
  const scale = useFitScale(mode, width, height)
  const SceneComponent = step.diagram.scene
  const groupKey = step.diagram.groupKey
  const identity = groupKey ? `${groupKey}:${sceneIdentity(SceneComponent)}` : `${step.id}:${index}`
  return <div data-presentation-stage="" style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
    <motion.div data-presentation-canvas="" style={{ position: 'absolute', width, height, left: '50%', top: '50%', marginLeft: -width / 2, marginTop: -height / 2, scale, transformOrigin: 'center' }}>
      <LayoutGroup id={groupKey ?? `step-${step.id}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={identity} data-presentation-scene="" style={{ width: '100%', height: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <SceneComponent payload={step.diagram.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </motion.div>
  </div>
}
