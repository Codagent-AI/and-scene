import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE } from './constants'
import { stageKey } from './sceneKey'
import type { AnyStep } from './types'

export interface StageProps {
  step: AnyStep
  index: number
  scale: number
  designWidth?: number
  designHeight?: number
}

/** Hosts the active step's Scene on the fixed canvas, scaled uniformly. */
export function Stage({
  step,
  index,
  scale,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
}: StageProps) {
  const { Scene, payload, id, era, title, caption } = step
  return (
    <div
      data-presentation-stage
      style={{ position: 'relative', width: designWidth * scale, height: designHeight * scale }}
    >
      <div
        data-presentation-canvas
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <LayoutGroup>
          <AnimatePresence>
            <motion.div
              key={stageKey(step)}
              data-presentation-scene
              data-presentation-scene-step={id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T, ease: EASE }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene step={{ id, era, title, caption }} index={index} payload={payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
