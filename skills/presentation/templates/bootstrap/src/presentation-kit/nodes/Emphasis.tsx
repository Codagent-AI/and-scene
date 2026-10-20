import { motion } from 'motion/react'
import { entityAttrs, type EntityProps } from './entity.ts'

export function Emphasis({ id, ...rest }: EntityProps) {
  return <motion.div {...entityAttrs(id, 'emphasis')} aria-hidden="true" {...rest} />
}
