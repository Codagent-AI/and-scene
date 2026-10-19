import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE } from './constants'
import { EntityRegistry, EntityRegistryContext } from './entrance'
import { sceneKey } from './steps'
import type { Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  scale: number
  designWidth?: number
  designHeight?: number
}

/**
 * Fixed design canvas scaled uniformly to fit. The active step's scene is
 * hosted under one LayoutGroup with overlapping presence, so shared layoutIds
 * morph; grouped steps keep a single mounted scene and only change payload.
 */
export function Stage<TPayload>({
  step,
  index,
  scale,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
}: StageProps<TPayload>) {
  const [registry] = useState(() => new EntityRegistry())
  useEffect(() => {
    registry.markStarted()
  }, [registry])
  const { Scene, payload, id, era, title, caption } = step
  const meta = { id, era, title, caption }
  return (
    <EntityRegistryContext.Provider value={registry}>
      <LayoutGroup>
        <motion.div
          data-presentation-stage=""
          data-presentation-scale={scale}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: designWidth,
            height: designHeight,
            x: '-50%',
            y: '-50%',
            scale,
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene={step.groupKey ?? step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: ENTER_T, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }}
              style={{ position: 'absolute', left: 0, top: 0, width: designWidth, height: designHeight }}
            >
              <Scene payload={payload} step={meta} index={index} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </EntityRegistryContext.Provider>
  )
}
