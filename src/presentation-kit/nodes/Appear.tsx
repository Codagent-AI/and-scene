import { motion } from 'motion/react'
import type { ComponentProps } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export function Appear(props: ComponentProps<typeof motion.div>) {
  return <motion.div {...props} data-presentation-appear="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }} />
}
