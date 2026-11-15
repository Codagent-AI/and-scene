import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { forwardRef } from 'react'
import { LAYOUT_T } from '../constants'
const LabelState = forwardRef<HTMLSpanElement, { text: string }>(function LabelState({ text }, ref) {
  const present = useIsPresent()
  return <motion.span ref={ref} data-presentation-label-active={present ? 'true' : 'false'} aria-hidden={!present} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T}>{text}</motion.span>
})
export function AnimatedLabel({ text }: { text: string }) {
  return <span data-presentation-label-host="" style={{ position: 'relative', display: 'inline-block' }}><AnimatePresence initial={false} mode="popLayout"><LabelState key={text} text={text} /></AnimatePresence></span>
}
