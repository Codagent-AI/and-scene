import { MotionNode } from './MotionNode.tsx'
import type { NodeProps } from './types.ts'

/** Small chip carrying a symbol or short text. */
export function SymbolChip(props: NodeProps) {
  return <MotionNode kind="symbol-chip" tag="span" {...props} />
}
