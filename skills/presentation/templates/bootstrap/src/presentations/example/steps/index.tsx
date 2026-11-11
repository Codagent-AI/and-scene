import { AnimatePresence, motion } from 'motion/react'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { EASE, ENTER_DELAY, LAYOUT_T } from '../../../presentation-kit/constants'
import { entities } from '../entities'

interface Payload {
  showResult: boolean
}

function Scene({ payload }: SceneProps<Payload>) {
  return (
    <>
      <motion.div
        layout
        layoutId={entities.topic}
        data-presentation-node="topic"
        style={{ position: 'absolute', left: 100, top: 100 }}
        transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      >
        Your topic
      </motion.div>
      <AnimatePresence>
        {payload.showResult && (
          <motion.div
            key={entities.result}
            layout
            layoutId={entities.result}
            data-presentation-node="result"
            style={{ position: 'absolute', left: 450, top: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: ENTER_DELAY } }}
            exit={{ opacity: 0 }}
            transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
          >
            What changes
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const STEPS: Step<Payload>[] = [
  {
    id: 'the-question',
    era: 'beginning',
    title: 'Start with the question',
    caption: 'Replace this caption with the first beat of your story.',
    groupKey: 'example',
    Scene,
    payload: { showResult: false },
  },
  {
    id: 'the-change',
    era: 'beginning',
    title: 'Show what changes',
    caption: 'Keep the topic in place while the next part of the explanation appears.',
    groupKey: 'example',
    Scene,
    payload: { showResult: true },
  },
]
