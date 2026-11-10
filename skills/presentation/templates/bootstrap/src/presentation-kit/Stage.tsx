import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
export function sceneKey<T>(steps: readonly Step<T>[], index: number) {
  let start = index
  const step = steps[index]
  while (start > 0 && step.groupKey && steps[start - 1].groupKey === step.groupKey && steps[start - 1].Scene === step.Scene) start--
  return steps[start].id
}
export function Stage<T>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H }: {
  steps: readonly Step<T>[]; index: number; mode: Mode; width?: number; height?: number
}) {
  const scale = useFitScale(mode, width, height)
  const group = useId()
  const step = steps[index]
  const Scene = step.Scene
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <div data-presentation-canvas="" data-scale={scale} style={{ width, height, position: 'relative', transform: `scale(${scale})`, flexShrink: 0 }}>
      <LayoutGroup id={group}>
        <AnimatePresence initial={false}>
          <motion.div key={sceneKey(steps, index)} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }} style={{ position: 'absolute', inset: 0 }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
