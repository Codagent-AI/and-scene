import { useId, useRef } from 'react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useFitScale } from './useFitScale'
import type { Step } from './types'

interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  sceneKey: string
  width: number
  height: number
}

export function Stage<TPayload>({ step, stepIndex, sceneKey, width, height }: StageProps<TPayload>) {
  const viewport = useRef<HTMLDivElement>(null)
  const layoutId = useId()
  const scale = useFitScale(viewport, width, height)
  const { Scene, payload } = step

  return (
    <div
      ref={viewport}
      data-presentation-stage=""
      style={{ position: 'relative', display: 'grid', placeItems: 'center', minWidth: 0, minHeight: 0 }}
    >
      <div style={{ width: width * scale, height: height * scale }}>
        <div
          data-presentation-canvas=""
          style={{ position: 'relative', width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <LayoutGroup id={layoutId}>
            <AnimatePresence initial={false}>
              {/* Individual entities own opacity so shared layout identities can cross-fade. */}
              <div key={sceneKey} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }}>
                <Scene payload={payload} stepIndex={stepIndex} />
              </div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
