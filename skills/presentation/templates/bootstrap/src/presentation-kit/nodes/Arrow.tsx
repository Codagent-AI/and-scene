import { motion } from 'motion/react'
import type { ComponentProps } from 'react'

export function Arrow({ id, ...props }: Omit<ComponentProps<typeof motion.path>, 'layoutId'> & { id: string }) {
  return <motion.path {...props} layout layoutId={id} data-presentation-node="arrow" data-entity-id={id} />
}
