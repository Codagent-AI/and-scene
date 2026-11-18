import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const { scale, geometry } = useFitScale(mode, width, height)
  const id = useId()
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'absolute', ...geometry, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
    <div style={{ width: width * scale, height: height * scale, position: 'relative' }}>
      <div data-presentation-canvas="" data-scale={scale} style={{ position: 'absolute', width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <LayoutGroup id={id}><AnimatePresence initial={false} mode="sync">
          <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence></LayoutGroup>
      </div>
    </div>
  </div>
}
