import type { ComponentPropsWithoutRef } from 'react'

export type FrameProps = ComponentPropsWithoutRef<'div'>

export function Frame({ className, children, ...rest }: FrameProps) {
  return (
    <div data-presentation-frame="" className={className} {...rest}>
      {children}
    </div>
  )
}
