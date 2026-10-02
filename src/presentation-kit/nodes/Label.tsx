import type { ReactNode } from 'react'
import type { StyleProps } from '../types'
export function Label({ id, children, className, style, ...props }: StyleProps & { id?: string; children: ReactNode }) {
  return <div className={['scene-label', className].filter(Boolean).join(' ')} style={style} data-scene-entity={id} {...props}>{children}</div>
}
