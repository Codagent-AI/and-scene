import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
import type { PresentationMode } from './types'

interface StageProps<T> { steps: readonly Step<T>[]; index: number; mode: PresentationMode; designWidth: number; designHeight: number; onTouchStart: React.TouchEventHandler<HTMLDivElement>; onTouchEnd: React.TouchEventHandler<HTMLDivElement> }

export function Stage<T>({ steps, index, mode, designWidth, designHeight, onTouchStart, onTouchEnd }: StageProps<T>) {
  const step = steps[index]
  const scale = useFitScale(mode, designWidth, designHeight)
  const sharesScene = (candidate: Step<T> | undefined) => candidate?.groupKey === step.groupKey && candidate?.Scene === step.Scene
  const grouped = Boolean(step.groupKey && (sharesScene(steps[index - 1]) || sharesScene(steps[index + 1])))
  const Scene = step.Scene
  return <div className="presentation-stage" data-presentation-stage="" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <motion.div className="presentation-canvas" data-presentation-canvas="" style={{ width: designWidth, height: designHeight, scale }}>
      <LayoutGroup id="presentation-scene">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div className="presentation-scene-host" data-presentation-scene="" key={grouped ? `group:${step.groupKey}` : step.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <Scene key={grouped ? step.groupKey : step.id} step={step} payload={step.payload} index={index} total={steps.length} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </motion.div>
  </div>
}
