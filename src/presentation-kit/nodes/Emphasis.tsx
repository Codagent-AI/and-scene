import { motion } from 'motion/react'
import type { ComponentProps } from 'react'

export function Emphasis({ id, ...props }: Omit<ComponentProps<typeof motion.div>, 'layoutId'> & { id: string }) {
  return <motion.div {...props} layout layoutId={id} data-presentation-node="emphasis" data-entity-id={id} />
}
