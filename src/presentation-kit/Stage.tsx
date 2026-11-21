import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { EASE, STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'

function sceneKeys<T>(steps: readonly Step<T>[]) {
  let key = ''
  return steps.map((step, index) => {
    const previous = steps[index - 1]
    if (step.groupKey === undefined || step.groupKey !== previous?.groupKey || step.Scene !== previous.Scene) {
      key = step.id
    }
    return key
  })
}

export function Stage<T>({ steps, index, width, height, mode }: {
  steps: readonly Step<T>[]
  index: number
  width: number
  height: number
  mode: Mode
}) {
  const layout = STAGE_LAYOUT[mode]
  const { ref, scale } = useFitScale(width, height)
  const id = useId()
  const step = steps[index]
  const key = sceneKeys(steps)[index]

  return (
    <section data-presentation-stage="" aria-label="Scene" style={{
      minWidth: 0, minHeight: 0, paddingInline: layout.inline, paddingBlock: layout.block,
    }}>
      <div ref={ref} style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
        <div data-presentation-fit="" data-scale={scale} style={{
          position: 'relative', width: width * scale, height: height * scale,
        }}>
          <div data-presentation-canvas="" style={{
            position: 'absolute', width, height, transform: `scale(${scale})`, transformOrigin: 'top left',
          }}>
            <LayoutGroup id={id}>
              <AnimatePresence initial={false}>
                <motion.div key={key} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.24, ease: EASE }}>
                  <step.Scene payload={step.payload} />
                </motion.div>
              </AnimatePresence>
            </LayoutGroup>
          </div>
        </div>
      </div>
    </section>
  )
}
