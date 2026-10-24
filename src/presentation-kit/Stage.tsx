import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { EASE, ENTER_T } from './constants'
import { hostKey } from './hostKey'
import type { Mode, Step } from './types'

export interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: Mode
  canvas: { width: number; height: number }
}

/** Fixed design canvas, scaled to fit, hosting the active step's scene. */
export function Stage<TPayload>({ steps, index, mode, canvas }: StageProps<TPayload>) {
  const areaRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(areaRef, canvas, mode)
  const step = steps[index]

  return (
    <div
      ref={areaRef}
      data-presentation-stage-area=""
      style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: canvas.width,
          height: canvas.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            {step && (
              <motion.div
                key={hostKey(step)}
                data-presentation-scene=""
                data-presentation-group={step.groupKey}
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T, ease: EASE }}
              >
                <step.Scene payload={step.payload} stepIndex={index} />
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
