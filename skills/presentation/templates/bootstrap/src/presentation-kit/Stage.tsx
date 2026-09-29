import { AnimatePresence, LayoutGroup } from 'motion/react'
import { motion } from 'motion/react'
import { useFitScale } from './useFitScale.ts'
import { EASE, LAYOUT_T } from './constants.ts'
import type { PresentationMode, Step } from './types.ts'
import type { RefObject } from 'react'

interface StageProps<T> {
  steps: readonly Step<T>[]
  index: number
  mode: PresentationMode
  width: number
  height: number
  containerRef: RefObject<HTMLElement | null>
}

export function Stage<T>({ steps, index, mode, width, height, containerRef }: StageProps<T>) {
  const scale = useFitScale(containerRef, mode, width, height)
  const step = steps[index]
  if (!step) return null
  const previous = steps[index - 1]
  const next = steps[index + 1]
  const grouped = Boolean(step.groupKey && (
    (previous?.groupKey === step.groupKey && previous.Scene === step.Scene) ||
    (next?.groupKey === step.groupKey && next.Scene === step.Scene)
  ))
  const key = grouped ? step.groupKey! : step.id
  return (
    <div className="presentation-stage" data-presentation-stage="" data-presentation-mode={mode}>
      <div className="presentation-canvas-frame" style={{ width: width * scale, height: height * scale }}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div key={key} data-presentation-scene-host="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }} style={{ position: 'absolute', inset: 0, width, height }}>
              <step.Scene payload={step.payload} step={step} index={index} total={steps.length} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
      <style>{`
        .presentation-stage { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; }
        .presentation-canvas-frame { position: relative; flex: none; }
        .presentation-canvas-frame > [data-presentation-scene-host] { transform: scale(${scale}); transform-origin: top left; }
      `}</style>
    </div>
  )
}

export { LAYOUT_T, EASE }
