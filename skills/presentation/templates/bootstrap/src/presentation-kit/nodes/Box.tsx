import type { EntityNodeProps } from '../types'
import { MotionNode } from './MotionNode'
export function Box({ className = '', ...props }: EntityNodeProps) {
  return <MotionNode kind="box" className={`scene-box ${className}`.trim()} {...props} />
}
