import { Box } from './Box'
import type { NodeProps } from './Box'
export function Emphasis(props: NodeProps) {
  return <Box {...props} data-presentation-node="emphasis" />
}
