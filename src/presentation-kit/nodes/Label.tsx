import { Box } from './Box'
import type { NodeProps } from './Box'
export function Label(props: NodeProps) {
  return <Box data-presentation-node="label" {...props} />
}
