import { useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T, STAGE_LAYOUT } from './constants'
import type { Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<T> { step: Step<T>; index: number; mode: 'browse' | 'present'; width?: number; height?: number }

export function Stage<T>({ step, index, mode, width = DESIGN_W, height = DESIGN_H }: StageProps<T>) {
  const [viewport, setViewport] = useState<HTMLElement | null>(null)
  const scale = useFitScale(viewport, width, height)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const insets = STAGE_LAYOUT[mode]
  const Scene = step.Scene
  const group = step.groupKey ?? step.id
  return <div className="presentation-stage" data-presentation-stage="" data-presentation-mode={mode}
    onPointerDown={(event) => { touchStart.current = { x: event.clientX, y: event.clientY } }}
    onPointerUp={(event) => {
      if (!touchStart.current) return
      const dx = event.clientX - touchStart.current.x
      const dy = event.clientY - touchStart.current.y
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) window.dispatchEvent(new CustomEvent('presentation:swipe', { detail: { direction: dx < 0 ? 'next' : 'prev' } }))
      touchStart.current = null
    }}>
    <div className="presentation-stage__viewport" ref={setViewport}>
      <div className="presentation-stage__scaled" style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence initial={false} mode="sync">
            <motion.div className="presentation-stage__scene" key={group} data-presentation-scene-group={group}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}
              style={{ position: 'absolute', inset: `${insets.top}px ${insets.side}px ${insets.bottom}px` }}>
              <Scene payload={step.payload} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  </div>
}
