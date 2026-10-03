import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T, STAGE_LAYOUT } from './constants'
import type { Step } from './types'
import { SceneLayer } from './nodes/SceneLayer'

export function Stage<T>({ step, index, total, mode, width = DESIGN_W, height = DESIGN_H, scale, touchHandlers }: { step: Step<T>; index: number; total: number; mode: 'browse' | 'present'; width?: number; height?: number; scale: number; touchHandlers: { onTouchStart: (event: React.TouchEvent) => void; onTouchEnd: (event: React.TouchEvent) => void } }) {
  const bounds = STAGE_LAYOUT[mode]
  const Scene = step.scene
  return <div data-presentation-stage data-mode={mode} {...touchHandlers} style={{ position: 'absolute', top: bounds.top, bottom: bounds.bottom, left: bounds.side, right: bounds.side, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)', placeItems: 'center', overflow: 'hidden' }}>
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
