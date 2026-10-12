import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step } from './types'
import { ENTER_T, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import { getCanvasPlacementStyle } from './canvasGeometry'
export function Stage<T>({ steps, index, mode, onSwipe }: { steps: readonly Step<T>[]; index: number; mode: 'browse'|'present'; onSwipe: (delta: number) => void }) {
 const scale = useFitScale(mode), step = steps[index]
 if (!step) return <div data-presentation-stage />
 const start = (event: React.TouchEvent) => { (event.currentTarget as HTMLElement).dataset.touchStart = String(event.touches[0].clientX) }
 const end = (event: React.TouchEvent) => { const x = Number((event.currentTarget as HTMLElement).dataset.touchStart); const delta = event.changedTouches[0].clientX - x; if (Math.abs(delta) > 45) onSwipe(delta < 0 ? 1 : -1) }
 return <div data-presentation-stage onTouchStart={start} onTouchEnd={end} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}><div data-presentation-canvas style={{ ...getCanvasPlacementStyle(scale), width: 880, height: 380, position: 'absolute', flex: 'none' }}><LayoutGroup id="presentation-stage"><AnimatePresence mode="wait" initial={false}><motion.div key={step.groupKey ? `${step.groupKey}:${step.Scene.displayName ?? step.Scene.name}` : step.id} data-presentation-scene initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: ENTER_T } }} exit={{ opacity: 0, transition: LAYOUT_T }} style={{ position: 'absolute', inset: 0 }}><step.Scene payload={step.payload} /></motion.div></AnimatePresence></LayoutGroup></div></div>
}
