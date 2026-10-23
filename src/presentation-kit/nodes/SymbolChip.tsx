import { Box, type BoxProps } from './Box'

/** Small chip holding a symbol: a Lucide glyph, text, or both. */
export function SymbolChip(props: BoxProps) {
  return <Box kind="symbol-chip" {...props} />
}
