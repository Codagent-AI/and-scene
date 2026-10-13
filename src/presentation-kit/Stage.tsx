import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode } from './types'

interface StageProps<TPayload> { steps: Step<TPayload>[]; index: number; mode: PresentationMode; swipeRef: (element: HTMLDivElement | null) => void }

export function Stage<TPayload>({ steps, index, mode, swipeRef }: StageProps<TPayload>) {
  const step = steps[index]
  const scale = useFitScale(mode)
  if (!step) return null
  const previous = steps[index - 1]
  const continuingGroup = Boolean(previous?.groupKey && previous.groupKey === step.groupKey && previous.Scene === step.Scene)
  const sceneKey = step.groupKey && (continuingGroup || !previous) ? step.groupKey : step.id
  const SceneComponent = step.Scene
  return (
    <div ref={swipeRef} data-presentation-stage data-step-count={steps.length} data-step-index={index}>
      <LayoutGroup id="presentation-scene">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={sceneKey} data-presentation-canvas style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'center center', position: 'absolute', left: '50%', top: '50%', marginLeft: -DESIGN_W / 2, marginTop: -DESIGN_H / 2 }} transition={LAYOUT_T}>
            <SceneComponent payload={step.payload} step={step} index={index} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}
