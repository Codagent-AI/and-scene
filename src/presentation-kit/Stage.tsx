import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ENTER_T } from './constants'
import { useFitScale } from './useFitScale'
import type { AnyStep, CanvasSize, PresentationMode } from './types'

export interface StageProps {
  step: AnyStep
  index: number
  mode: PresentationMode
  canvas: CanvasSize
}

/**
 * Fixed design canvas scaled uniformly to fit. Steps with the same group key keep
 * one mounted scene (only the payload changes); other changes cross-fade while
 * shared layout ids morph.
 */
export function Stage({ step, index, mode, canvas }: StageProps) {
  const holder = useRef<HTMLDivElement>(null)
  const scale = useFitScale(holder, mode, canvas)
  const key = step.groupKey ?? step.id
  const { Scene } = step

  return (
    <div
      ref={holder}
      data-presentation-stage=""
      style={{
        position: 'relative',
        flex: '1 1 0',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'relative',
          flex: 'none',
          width: canvas.width,
          height: canvas.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={key}
              data-presentation-scene={key}
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
            >
              <Scene payload={step.payload} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
