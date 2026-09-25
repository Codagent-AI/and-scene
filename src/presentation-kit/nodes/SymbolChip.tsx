import type { NodeProps } from './Box'
import { Box } from './Box'
export function SymbolChip(props: NodeProps) { return <Box {...props} className={`scene-symbol-chip ${props.className ?? ''}`} /> }
