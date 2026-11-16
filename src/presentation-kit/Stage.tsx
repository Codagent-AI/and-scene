import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
export function Stage<T>({ step, mode, namespace, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; namespace: string; width?: number; height?: number }) {
  const scale = useFitScale(mode, width, height)
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'relative', width: width * scale, height: height * scale }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup id={namespace}><AnimatePresence initial={false} mode="sync">
        <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T} style={{ position: 'absolute', inset: 0 }}><Scene payload={step.payload} /></motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
