import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, EXIT_T, type Mode } from './constants'
import { sceneKey } from './steps'
import type { AnyStep } from './types'
import { useFitScale } from './useFitScale'

/**
 * Fixed design canvas scaled uniformly to fit. Steps that share a scene key keep one mounted
 * Scene (only `payload` changes); otherwise scenes cross-fade and shared `layoutId`s morph.
 */
export function Stage({ step, mode }: { step: AnyStep; mode: Mode }) {
  const scale = useFitScale(mode)
  const { Scene, payload } = step
  return (
    <div
      data-presentation-stage=""
      style={{
        flex: '1 1 0',
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, position: 'relative' }}>
        <motion.div
          data-presentation-canvas=""
          data-presentation-scale={scale.toFixed(4)}
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            position: 'absolute',
            left: 0,
            top: 0,
            originX: 0,
            originY: 0,
            scale,
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: EXIT_T, ease: EASE } }}
                exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Scene payload={payload} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </div>
    </div>
  )
}
