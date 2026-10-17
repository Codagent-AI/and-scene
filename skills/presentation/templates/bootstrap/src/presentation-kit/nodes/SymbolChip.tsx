import { Box, type BoxProps } from './Box.tsx'

/** Small symbol entity: an icon and/or short text. */
export function SymbolChip({ kind = 'chip', ...props }: BoxProps) {
  return <Box kind={kind} {...props} />
}
