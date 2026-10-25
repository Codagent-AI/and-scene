import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale, useViewport } from './useFitScale'
import type { Mode, Step } from './types'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneKey<T>(step: Step<T>) {
  if (!sceneIds.has(step.Scene)) sceneIds.set(step.Scene, ++nextSceneId)
  return `${step.groupKey ?? step.id}:${sceneIds.get(step.Scene)}`
}
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const scale = useFitScale(mode, width, height)
  const viewport = useViewport()
  const geometry = STAGE_LAYOUT[mode]
  const left = mode === 'browse' && viewport.width >= 1100 ? 180 : 0
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left, right: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)', placeItems: 'center' }}>
    <div data-presentation-canvas="" data-scale={scale} style={{ position: 'relative', width, height, transform: `scale(${scale})`, flexShrink: 0 }}>
      <LayoutGroup>
        <AnimatePresence initial={false}>
          <motion.div key={sceneKey(step)} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T} style={{ position: 'absolute', inset: 0 }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
