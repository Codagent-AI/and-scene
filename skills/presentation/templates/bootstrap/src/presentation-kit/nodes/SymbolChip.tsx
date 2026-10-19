import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEntityProps, type Geometry, type NodeHtmlProps } from './entity'

export interface SymbolChipProps
  extends Geometry,
    NodeHtmlProps<HTMLDivElement> {
  id: string
  /** Text symbol; children win when provided. */
  symbol?: string
  Icon?: LucideIcon
  emphasis?: boolean
}

export function SymbolChip({
  id, x, y, w, h, symbol, Icon, emphasis, style, children, ...rest
}: SymbolChipProps) {
  const entity = useEntityProps({ id, kind: 'symbol-chip', x, y, w, h, emphasis, style })
  return (
    <motion.div {...rest} {...entity} data-presentation-symbol={symbol}>
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children ?? symbol}
    </motion.div>
  )
}
