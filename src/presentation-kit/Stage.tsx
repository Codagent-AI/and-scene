import { AnimatePresence, LayoutGroup } from 'motion/react'
import { EXIT_T } from './constants'
import type { Fit } from './useFitScale'
import { SceneLayer } from './nodes/SceneLayer'
import { sceneKey } from './sceneKey'
import type { Canvas, Step } from './types'

export interface StageProps {
  step: Step<unknown>
  fit: Fit
  canvas: Canvas
}

export function Stage({ step, fit, canvas }: StageProps) {
  const { region, scale } = fit
  const key = sceneKey(step)
  return (
    <div
      data-presentation-stage
      style={{
        position: 'absolute',
        top: region.top,
        bottom: region.bottom,
        left: region.left,
        right: region.right,
        overflow: 'hidden',
      }}
    >
      <LayoutGroup>
        <div
          data-presentation-canvas
          data-presentation-scale={scale}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: canvas.width,
            height: canvas.height,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <AnimatePresence initial={false}>
            <SceneLayer
              key={key}
              data-presentation-scene={key}
              exit={{ opacity: 0, transition: { duration: EXIT_T } }}
            >
              <step.Scene payload={step.payload} />
            </SceneLayer>
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  )
}
