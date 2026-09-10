import { motion } from 'motion/react'
import type { ComponentProps } from 'react'

export function Label({ id, ...props }: Omit<ComponentProps<typeof motion.span>, 'layoutId'> & { id: string }) {
  return <motion.span {...props} layout layoutId={id} data-presentation-node="label" data-entity-id={id} />
}
