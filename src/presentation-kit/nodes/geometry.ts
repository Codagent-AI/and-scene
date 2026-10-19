import type { CSSProperties } from 'react'

export interface Geometry {
  x?: number
  y?: number
  w?: number
  h?: number
}

/** Consumer `data-*` attributes passed through to the rendered element. */
export type DataHooks = { [key: `data-${string}`]: string | undefined }

/** Keeps only `data-*` attributes; kit hooks are spread after these so they always win. */
export function dataHooks(props: DataHooks): DataHooks {
  return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-')))
}

/** Absolute placement inside the fixed design canvas; only layout, no visual style. */
export function geometryStyle({ x, y, w, h }: Geometry, style?: CSSProperties): CSSProperties {
  const positioned = x !== undefined || y !== undefined
  return {
    ...(positioned ? { position: 'absolute' as const } : null),
    left: x,
    top: y,
    width: w,
    height: h,
    ...style,
  }
}
