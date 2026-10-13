import { useId, useMemo } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_T } from './constants'
import type { Step } from './types'
import type { computeFitScale } from './useFitScale'

export interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  fit: ReturnType<typeof computeFitScale>
}

export function Stage<TPayload>({ steps, index, fit }: StageProps<TPayload>) {
  const namespace = useId()
  // Each contiguous run is distinct. Reusing a group name after leaving it
  // cannot revive an exiting scene; component changes also begin a new run.
  const keys = useMemo(() => {
    let run = 0
    return steps.map((step, i) => {
      const previous = steps[i - 1]
      if (!previous || !step.groupKey || step.groupKey !== previous.groupKey || step.Scene !== previous.Scene) run++
      return `scene-${run}`
    })
  }, [steps])
  const step = steps[index]
  const Scene = step.Scene

  return <div style={{ position: 'absolute', left: fit.left, right: fit.right, top: fit.top, bottom: fit.bottom }}>
    <div data-presentation-stage style={{ position: 'absolute', width: DESIGN_W, height: DESIGN_H, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${fit.scale})` }}>
      <LayoutGroup id={namespace}>
        <AnimatePresence initial={false}>
          <motion.div key={keys[index]} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, ease: EASE }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
