import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { EASE, EXIT_T, type PresentationMode } from './constants'
import { useFitScale } from './useFitScale'
import type { CanvasSize, Step } from './types'

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: PresentationMode
  canvas: CanvasSize
}

/**
 * Hosts the active step's scene inside the fixed design canvas. Steps sharing a
 * `groupKey` keep one host key, so React updates the scene in place instead of
 * remounting it; other steps cross-fade.
 */
export function Stage<TPayload>({ steps, index, mode, canvas }: StageProps<TPayload>) {
  const { ref, scale } = useFitScale(mode, canvas)
  const step = steps[index]
  if (!step) return null
  const { Scene } = step
  const hostKey = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`

  return (
    <div
      ref={ref}
      className="presentation-stage"
      data-presentation-stage=""
      data-presentation-scale={scale.toFixed(3)}
      style={{
        position: 'relative',
        flex: '1 1 0',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: canvas.width * scale,
          height: canvas.height * scale,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="presentation-canvas"
          data-presentation-canvas=""
          style={{
            position: 'relative',
            width: canvas.width,
            height: canvas.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={hostKey}
                className="presentation-scene"
                data-presentation-scene=""
                data-presentation-step={step.id}
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.3, ease: EASE } }}
                exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
              >
                <Scene payload={step.payload} step={step} index={index} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
