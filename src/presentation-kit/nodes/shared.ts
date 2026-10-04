import type { CSSProperties, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
export type NodeProps = { id?: string; className?: string; style?: CSSProperties; children?: ReactNode; 'data-node'?: string }
export function nodeAttributes({ id, className, style, ...rest }: NodeProps) {
  return {
    layoutId: id,
    className,
    style,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY } },
    'data-presentation-node': '',
    ...rest,
  }
}
