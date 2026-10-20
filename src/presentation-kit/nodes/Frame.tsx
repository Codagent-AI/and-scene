import { motion } from 'motion/react'
import { entityAttrs, type EntityProps } from './entity.ts'

export function Frame({ id, ...rest }: EntityProps) {
  return <motion.div {...entityAttrs(id, 'frame')} {...rest} />
}
