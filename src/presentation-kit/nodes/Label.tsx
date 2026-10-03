import type { EntityNodeProps } from '../types'
import { MotionNode } from './MotionNode'
export function Label({ className = '', ...props }: EntityNodeProps) {
  return <MotionNode kind="label" className={`scene-label ${className}`.trim()} {...props} />
}
