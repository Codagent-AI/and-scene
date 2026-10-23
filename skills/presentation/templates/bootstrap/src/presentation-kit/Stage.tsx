import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { EASE, ENTER_T, type Mode } from './constants'
import { hostKey } from './hostKey'
import type { Step } from './types'
import { availableSpace, computeFitScale, DEFAULT_CANVAS, type Canvas } from './useFitScale'
import { useViewportSize } from './useViewportSize'

export interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: Mode
  canvas?: Canvas
}

export function Stage<TPayload>({ steps, index, mode, canvas = DEFAULT_CANVAS }: StageProps<TPayload>) {
  const { width, height } = useViewportSize()
  const avail = availableSpace(width, height, mode)
  const scale = computeFitScale(width, height, mode, canvas)
  const step = steps[index]
  if (!step) return null
  const { Scene } = step
  return (
    <div
      data-presentation-stage=""
      data-presentation-scale={scale.toFixed(4)}
      style={{
        position: 'absolute',
        left: avail.left,
        top: avail.top,
        width: Math.max(avail.width, 0),
        height: Math.max(avail.height, 0),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-presentation-canvas=""
        style={{ position: 'relative', flex: 'none', width: canvas.width * scale, height: canvas.height * scale }}
      >
        <div
          data-presentation-canvas-inner=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: canvas.width,
            height: canvas.height,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={hostKey(step)}
                data-presentation-scene-host=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T, ease: EASE }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
              >
                <Scene payload={step.payload} stepId={step.id} stepIndex={index} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
