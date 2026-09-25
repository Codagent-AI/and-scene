import type { EntityNodeProps } from '../types'
import { MotionNode } from './MotionNode'
export function Arrow({ className = '', ...props }: Omit<EntityNodeProps, 'children'> & { label?: string; 'aria-label'?: string }) {
  return <MotionNode kind="arrow" className={`scene-arrow ${className}`.trim()} {...props} aria-hidden={props['aria-label'] ? undefined : true}>→</MotionNode>
}
