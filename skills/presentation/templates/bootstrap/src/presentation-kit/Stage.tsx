import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'
import { sceneKey } from './model'
import type { Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  box: { left: number; right: number; top: number; bottom: number }
  designW?: number
  designH?: number
}

const fill = { position: 'absolute', inset: 0 } as const

/** Fixed design canvas, scaled uniformly; hosts the active step's scene. */
export function Stage<TPayload>({
  step,
  index,
  box,
  designW = DESIGN_W,
  designH = DESIGN_H,
}: StageProps<TPayload>) {
  const { ref, scale } = useFitScale(designW, designH)
  const { Scene, payload } = step
  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...box,
      }}
    >
      <div
        data-presentation-canvas-frame=""
        style={{ position: 'relative', width: designW * scale, height: designH * scale }}
      >
        <div
          data-presentation-canvas=""
          data-presentation-scale={scale.toFixed(4)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: designW,
            height: designH,
            transformOrigin: '0 0',
            transform: `scale(${scale})`,
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                style={fill}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T }}
              >
                <Scene payload={payload} stepIndex={index} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
