import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ENTER_T } from './constants'
import { useFitScale } from './useFitScale'
import type { Canvas, Mode, Step } from './types'

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: Mode
  canvas: Canvas
}

/**
 * Hosts the active step's scene on a fixed canvas scaled to fit. Steps that share
 * a `groupKey` keep one mounted scene; other steps cross-fade and morph shared layoutIds.
 */
export function Stage<TPayload>({ step, index, mode, canvas }: StageProps<TPayload>) {
  const area = useRef<HTMLDivElement>(null)
  const scale = useFitScale(area, mode, canvas)
  const { Scene } = step
  // `payload` is optional only when TPayload admits undefined, so this read is sound.
  const payload = step.payload as TPayload

  return (
    <div
      ref={area}
      data-presentation-stage
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        data-presentation-canvas
        data-presentation-scale={scale.toFixed(3)}
        style={{ position: 'relative', width: canvas.width * scale, height: canvas.height * scale }}
      >
        <div
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
            <AnimatePresence>
              <motion.div
                key={step.groupKey ?? step.id}
                data-presentation-scene={step.groupKey ?? step.id}
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T }}
              >
                <Scene payload={payload} step={step} index={index} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
