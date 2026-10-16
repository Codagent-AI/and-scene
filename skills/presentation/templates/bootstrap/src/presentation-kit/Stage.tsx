import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T } from './constants.ts'
import { useFitScale } from './useFitScale.ts'
import type { AnyStep, Mode } from './types.ts'

interface StageProps {
  step: AnyStep
  index: number
  mode: Mode
  design?: { width: number; height: number }
}

/**
 * Hosts the active step's Scene on a fixed design canvas scaled to fit the stage box.
 * Steps sharing a `groupKey` keep one mounted Scene (only `payload` changes);
 * otherwise scenes cross-fade and shared `layoutId` entities morph.
 */
export function Stage({ step, index, mode, design }: StageProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(boxRef, mode, design)
  const width = design?.width ?? DESIGN_W
  const height = design?.height ?? DESIGN_H
  const sceneKey = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
  const { Scene } = step

  return (
    <div
      ref={boxRef}
      data-presentation-stage=""
      data-mode={mode}
      style={{ position: 'relative', flex: '1 1 0', minHeight: 0, minWidth: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-scale={scale.toFixed(3)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey}
              data-presentation-scene=""
              data-step-id={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: EXIT_T } }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={step.payload} stepIndex={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
