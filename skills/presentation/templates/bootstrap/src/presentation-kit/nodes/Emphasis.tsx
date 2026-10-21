import { Node } from './Node'
import type { NodeProps } from './Node'

/** An empty marker laid over another entity; presentation CSS draws the emphasis. */
export function Emphasis({ style, ...rest }: NodeProps) {
  return <Node kind="emphasis" aria-hidden style={{ pointerEvents: 'none', ...style }} {...rest} />
}
