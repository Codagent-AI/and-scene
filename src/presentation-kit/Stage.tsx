import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { ENTER_DELAY, ENTER_T, EASE, LAYOUT_T } from './constants'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'

type Props<TPayload> = { step: Step<TPayload>; mode: PresentationMode; className?: string }

export function Stage<TPayload>({ step, mode, className }: Props<TPayload>) {
  const { scale, width, height } = useFitScale(mode)
  const Scene = step.scene
  const stageStyle = { width, height } satisfies CSSProperties
  const canvasStyle = { width: 880, height: 380, transform: `scale(${scale})`, transformOrigin: 'top left' } satisfies CSSProperties

  return (
    <div className={className} data-presentation-stage data-presentation-mode={mode} style={stageStyle}>
      <div data-presentation-canvas style={canvasStyle}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={step.groupKey ?? step.id}
              data-presentation-scene
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
            >
              <Scene payload={step.payload} step={step} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
        <style>{`[data-presentation-scene] [data-presentation-appear] { animation-delay: ${ENTER_DELAY}s; animation-duration: ${ENTER_T}s; }`}</style>
      </div>
    </div>
  )
}
