import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const scale = useFitScale(mode, width, height)
  const namespace = useId()
  const Scene = step.Scene
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage="" style={{ position: 'absolute', inset: `${geometry.top}px ${geometry.inset}px ${geometry.bottom}px`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)', placeItems: 'center' }}>
    <div data-presentation-canvas="" data-scale={scale} style={{ width, height, position: 'relative', transform: `scale(${scale})`, flexShrink: 0 }}>
      <LayoutGroup id={namespace}>
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
