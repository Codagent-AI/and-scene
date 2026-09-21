import type { ReactNode } from 'react'

export function Appear({ children, className }: { children?: ReactNode; className?: string }) { return <div className={className} data-presentation-appear>{children}</div> }
