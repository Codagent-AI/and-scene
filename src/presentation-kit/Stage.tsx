import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: PresentationMode
  width?: number
  height?: number
}

export function Stage<TPayload>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H }: StageProps<TPayload>) {
  const scale = useFitScale(mode, width, height)
  const step = steps[index]
  const prior = steps[index - 1]
  const grouped = Boolean(step.groupKey && prior?.groupKey === step.groupKey && prior.Scene === step.Scene)
  let groupStart = index
  while (groupStart > 0 && step.groupKey && steps[groupStart - 1].groupKey === step.groupKey && steps[groupStart - 1].Scene === step.Scene) groupStart -= 1
  const sceneKey = step.groupKey ? `group:${step.groupKey}:${groupStart}` : `step:${step.id}`
  const Scene = step.Scene
  const content = <Scene payload={step.payload} step={step} index={index} total={steps.length} />

  return <div className="presentation-stage" data-presentation-stage="" data-mode={mode}>
    <div className="presentation-stage-viewport" style={{ width: width * scale, height: height * scale }}>
      <div className="presentation-stage-canvas" style={{ width, height, transform: `scale(${scale})` }}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="popLayout" initial={false}>
            {grouped
              ? <motion.div key={sceneKey} className="presentation-scene" data-presentation-scene="" layout transition={LAYOUT_T}>{content}</motion.div>
              : <motion.div key={sceneKey} className="presentation-scene" data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }}>{content}</motion.div>}
          </AnimatePresence>
          <motion.div className="presentation-newcomer-timing" data-presentation-enter-delay="" animate={{ opacity: 1 }} transition={{ delay: ENTER_DELAY }} aria-hidden="true" />
        </LayoutGroup>
      </div>
    </div>
  </div>
}
