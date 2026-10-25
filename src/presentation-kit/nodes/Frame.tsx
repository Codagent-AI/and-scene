import type { ReactNode } from 'react'
import { Entity } from './Entity.tsx'
import type { NodeHooks } from './placement.ts'

export interface FrameProps extends NodeHooks {
  children?: ReactNode
}

/** A grouping region. Draws nothing by itself; presentation CSS targets the hook. */
export function Frame(props: FrameProps) {
  return <Entity kind="frame" {...props} />
}
