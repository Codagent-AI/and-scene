import { Box } from './Box'
import type { NodeProps } from './Box'
export function Arrow(props: NodeProps) {
  return <Box {...props} data-presentation-node="arrow" />
}
