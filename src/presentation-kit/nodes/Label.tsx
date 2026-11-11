import { Box } from './Box'
import type { NodeProps } from './Box'
export function Label(props: NodeProps) {
  return <Box {...props} data-presentation-node="label" />
}
