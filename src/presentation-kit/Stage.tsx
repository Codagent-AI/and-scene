import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T } from './constants'
import { LayoutSnapContext } from './layoutSnap'
import { hostKey } from './steps'
import type { Canvas, Mode, SceneStep } from './types'
import { useFitScale } from './useFitScale'

export interface StageProps {
  step: SceneStep
  mode: Mode
  canvas?: Canvas
}

/**
 * Fixed design canvas scaled to fit. Steps with equal host keys keep one scene instance;
 * otherwise the outgoing step fades while shared `layoutId` entities morph into the new one.
 */
export function Stage({ step, mode, canvas }: StageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFitScale(ref, mode, canvas)
  // A mode or viewport change moves every entity on screen; that is a re-render, not a morph,
  // so entities snap for the commit in which the fit geometry changed.
  const fit = `${mode}:${scale.toFixed(4)}`
  const [settledFit, setSettledFit] = useState(fit)
  const snapping = settledFit !== fit
  useEffect(() => {
    if (!snapping) return
    const frame = requestAnimationFrame(() => setSettledFit(fit))
    return () => cancelAnimationFrame(frame)
  }, [snapping, fit])
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  return (
    <div
      ref={ref}
      data-presentation-stage=""
      style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <motion.div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: `calc(50% - ${width / 2}px)`,
          top: `calc(50% - ${height / 2}px)`,
          width,
          height,
          scale,
        }}
      >
        <LayoutSnapContext value={snapping}>
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={hostKey(step)}
                data-presentation-step-host=""
                exit={{ opacity: 0, transition: { duration: EXIT_T } }}
                style={{ position: 'absolute', inset: 0 }}
              >
                {step.render()}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </LayoutSnapContext>
      </motion.div>
    </div>
  )
}
