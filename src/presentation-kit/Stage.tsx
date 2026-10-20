import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import type { Mode, Step } from './types.ts'
import { useFitScale } from './useFitScale.ts'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  mode: Mode
}

export function Stage<TPayload>({ step, mode }: StageProps<TPayload>) {
  const { scale, top, bottom } = useFitScale(mode)
  const { Scene, payload } = step
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        bottom,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-presentation-fit=""
        data-presentation-scale={scale}
        style={{ position: 'relative', flex: 'none', width: DESIGN_W * scale, height: DESIGN_H * scale }}
      >
        {/* A zero-duration layout node lets motion see the fit scale when projecting morphs. */}
        <motion.div
          layout
          transition={{ duration: 0 }}
          data-presentation-canvas=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: DESIGN_W,
            height: DESIGN_H,
            scale,
            originX: 0,
            originY: 0,
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Scene payload={payload} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </div>
    </div>
  )
}
