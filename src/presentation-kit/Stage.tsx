import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ENTER_T } from './constants'
import type { Canvas, Mode } from './constants'
import type { PresentationStep } from './types'
import { useFitScale } from './useFitScale'

interface StageProps {
  step: PresentationStep
  mode: Mode
  canvas: Canvas
}

/**
 * Hosts the active step's scene on a fixed design canvas scaled to fit.
 * Steps with the same groupKey share one wrapper key, so the Scene instance
 * persists and only its payload changes; otherwise scenes cross-fade.
 */
export function Stage({ step, mode, canvas }: StageProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(areaRef, canvas, mode)

  return (
    <div
      ref={areaRef}
      data-presentation-stage=""
      style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(3)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: canvas.width,
          height: canvas.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <LayoutGroup>
          <AnimatePresence>
            <motion.div
              key={step.groupKey ?? step.id}
              data-presentation-scene={step.groupKey ?? step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {step.render()}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
