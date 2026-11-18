import { Node } from './Node'
import type { NodeProps } from './Node'
export function Arrow({ children, bidirectional = false, path, ...props }: NodeProps & { bidirectional?: boolean; path?: string }) {
  return <Node data-presentation-node="arrow" {...props}><svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none"><path d={path ?? (bidirectional ? 'M8 10 H92 M84 3 L92 10 L84 17 M16 3 L8 10 L16 17' : 'M0 10 H92 M84 3 L92 10 L84 17')} fill="none" stroke="currentColor" /></svg>{children}</Node>
}
