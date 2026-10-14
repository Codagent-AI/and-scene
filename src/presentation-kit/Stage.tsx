import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE } from './constants'
import type { Mode, Step } from './types'
import { isWideViewport, stageInsets, useFitScale, useViewportSize } from './useFitScale'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneId(scene: object): number {
  let id = sceneIds.get(scene)
  if (id === undefined) sceneIds.set(scene, (id = nextSceneId++))
  return id
}

/** Steps with equal keys share one persistent scene instance. */
function sceneKey(step: Pick<Step<unknown>, 'id' | 'groupKey'> & { Scene: object }): string {
  return step.groupKey !== undefined
    ? `group:${step.groupKey}:${sceneId(step.Scene)}`
    : `step:${step.id}`
}

interface StageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: Step<any>
  index: number
  mode: Mode
}

export function Stage({ step, index, mode }: StageProps) {
  const scale = useFitScale(mode)
  const { width } = useViewportSize()
  const insets = stageInsets(mode, isWideViewport(width))
  const { Scene } = step

  return (
    <div
      data-presentation-stage=""
      style={{ position: 'absolute', ...insets }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
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
              transition={{ duration: ENTER_T, ease: EASE }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene step={step} index={index} payload={step.payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
