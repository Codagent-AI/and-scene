import { motion } from 'motion/react'
import { entityAttrs, type EntityProps } from './entity.ts'

export function SymbolChip({ id, ...rest }: EntityProps<'span'>) {
  return <motion.span {...entityAttrs(id, 'symbol-chip')} {...rest} />
}
