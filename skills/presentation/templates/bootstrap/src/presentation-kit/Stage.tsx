import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { EASE, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  mode: Mode
}

/**
 * Mounts the active step's Scene on the fixed design canvas. Steps that share a
 * groupKey keep the same keyed element, so the scene instance persists and only
 * its payload changes. Ungrouped steps get their own key, so AnimatePresence
 * cross-fades them while shared layoutIds morph.
 */
export function Stage<TPayload>({ step, mode }: StageProps<TPayload>) {
  const ref = useRef<HTMLDivElement>(null)
  const geometry = STAGE_LAYOUT[mode]
  const scale = useFitScale(ref, geometry)
  const sceneKey = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
  const { Scene } = step

  return (
    <div
      ref={ref}
      data-presentation-stage
      style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: geometry.width,
          height: geometry.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey}
              data-presentation-scene
              style={{ position: 'absolute', inset: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
            >
              <Scene payload={step.payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
