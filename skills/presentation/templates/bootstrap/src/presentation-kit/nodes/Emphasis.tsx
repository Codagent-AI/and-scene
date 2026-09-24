import type { EntityNodeProps } from '../types'
import { MotionNode } from './MotionNode'
export function Emphasis({ className = '', ...props }: EntityNodeProps) {
  return <MotionNode kind="emphasis" className={`scene-emphasis ${className}`.trim()} {...props} />
}
