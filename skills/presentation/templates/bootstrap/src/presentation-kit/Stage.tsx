import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: PresentationMode
  previousStep?: Step<TPayload>
}

const sceneIdentities = new WeakMap<object, number>()
let nextSceneIdentity = 0

function getSceneIdentity(scene: object) {
  const existing = sceneIdentities.get(scene)
  if (existing !== undefined) return existing
  const identity = nextSceneIdentity
  nextSceneIdentity += 1
  sceneIdentities.set(scene, identity)
  return identity
}

export function Stage<TPayload>({ step, index, mode, previousStep }: StageProps<TPayload>) {
  const scale = useFitScale(mode)
  const contiguousGroup =
    step.groupKey &&
    previousStep?.groupKey === step.groupKey &&
    previousStep.Scene === step.Scene
  const sceneKey = step.groupKey
    ? `group:${step.groupKey}:scene:${getSceneIdentity(step.Scene)}`
    : `step:${step.id}`
  const Scene = step.Scene

  return (
    <section data-presentation-stage data-presentation-mode={mode} aria-label="Presentation scene">
      <div
        data-presentation-canvas-wrap
        style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}
      >
        <LayoutGroup>
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={sceneKey}
              data-presentation-canvas
              initial={contiguousGroup ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
              style={{ width: DESIGN_W, height: DESIGN_H, transformOrigin: 'top left', scale }}
            >
              <Scene payload={step.payload} step={step} index={index} mode={mode} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  )
}
