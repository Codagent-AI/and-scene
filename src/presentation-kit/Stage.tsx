import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'

export function Stage<TPayload>({ step, mode, stepIndex }: { step: Step<TPayload>; mode: 'browse' | 'present'; stepIndex: number }) {
  const scale = useFitScale(mode)
  const grouped = step.groupKey ?? step.id
  const stageId = useId()
  return <div data-presentation-stage="true" data-scene-group={grouped} style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
    <div data-presentation-canvas="true" style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup id={stageId}>
        <AnimatePresence mode="popLayout" initial={false} custom={stepIndex}>
          <motion.div key={step.groupKey ? step.groupKey : step.id} data-presentation-scene="true" style={{ width: DESIGN_W, height: DESIGN_H }} transition={{ duration: LAYOUT_T, ease: EASE }}>
            <step.Scene payload={step.payload} step={step} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
