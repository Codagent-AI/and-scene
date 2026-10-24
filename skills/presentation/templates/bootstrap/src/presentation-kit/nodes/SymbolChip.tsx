import { MotionNode } from './MotionNode'
import type { NodeProps } from './nodeProps'

/** Small generic chip for a symbol, glyph, or short token. */
export function SymbolChip(props: NodeProps) {
  return <MotionNode kind="symbol-chip" as="span" {...props} />
}
