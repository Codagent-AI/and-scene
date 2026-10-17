import { Box, type NodeProps } from './Box.tsx'

/** Outline entity drawn around other entities. Its look comes from the presentation's CSS. */
export function Frame({ style, ...props }: NodeProps) {
  return <Box kind="frame" style={{ pointerEvents: 'none', ...style }} {...props} />
}
