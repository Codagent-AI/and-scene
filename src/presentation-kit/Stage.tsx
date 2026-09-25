import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import type { Step } from './types'
import { SceneLayer } from './nodes/SceneLayer'

export function Stage<T>({ step, index, total, mode, width = DESIGN_W, height = DESIGN_H, touchHandlers }: { step: Step<T>; index: number; total: number; mode: 'browse' | 'present'; width?: number; height?: number; touchHandlers: { onTouchStart: (event: React.TouchEvent) => void; onTouchEnd: (event: React.TouchEvent) => void } }) {
  const scale = useFitScale(width, height, mode)
  const Scene = step.scene
  return <div data-presentation-stage data-mode={mode} {...touchHandlers} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
    <motion.div data-presentation-canvas style={{ width, height, position: 'relative', flex: 'none', scale, transformOrigin: 'center' }}>
      <LayoutGroup id="and-scene">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={step.groupKey ?? step.id} data-presentation-scene data-step-id={step.id} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T}>
            <SceneLayer><Scene step={step} payload={step.payload} index={index} total={total} /></SceneLayer>
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </motion.div>
  </div>
}
