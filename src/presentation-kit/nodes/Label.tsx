import type { HTMLAttributes } from 'react'
export function Label(props: HTMLAttributes<HTMLSpanElement> & { layoutId?: string }) { return <span data-presentation-label {...props} /> }
