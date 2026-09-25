import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Step } from './types'

interface StageProps<T> { steps: readonly Step<T>[]; index: number; mode: 'browse' | 'present'; width?: number; height?: number }
const sceneIds = new WeakMap<Step<unknown>['Scene'], number>()
let nextSceneId = 1

function getSceneId(Scene: Step<unknown>['Scene']) {
  let id = sceneIds.get(Scene)
  if (!id) {
    id = nextSceneId++
    sceneIds.set(Scene, id)
  }
  return id
}

export default function Stage<T>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H }: StageProps<T>) {
  const step = steps[index]
  const scale = useFitScale(width, height, STAGE_LAYOUT[mode].top, STAGE_LAYOUT[mode].bottom)
  if (!step) return null
  const Scene = step.Scene
  const sceneKey = `${getSceneId(Scene as Step<unknown>['Scene'])}:${step.groupKey ?? step.id}`
  const geometry = STAGE_LAYOUT[mode]
  return <div className="presentation-stage" data-presentation-stage="" data-presentation-mode={mode} style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
    <div className="presentation-canvas" style={{ position: 'absolute', left: '50%', top: `calc(50% + ${(geometry.top - geometry.bottom) / 2}px)`, width, height, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center center', pointerEvents: 'auto' }}>
      <LayoutGroup id={`scene-${step.groupKey ?? step.id}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={sceneKey} className="presentation-scene" data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T}>
            <Scene payload={step.payload} step={step} index={index} />
          </motion.div>
        </AnimatePresence>
        <motion.div aria-hidden="true" data-presentation-appear-barrier="" key={`barrier-${sceneKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} />
      </LayoutGroup>
    </div>
  </div>
}
