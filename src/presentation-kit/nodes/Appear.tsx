import { useEffect, useState, type ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps extends ComponentPropsWithoutRef<typeof motion.div> {
  delayMs?: number
}

export function Appear({ delayMs = ENTER_DELAY * 1000, children, ...rest }: AppearProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  if (!visible) return null

  return (
    <motion.div
      data-presentation-node="appear"
      data-presentation-appear-state="visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ENTER_T }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
