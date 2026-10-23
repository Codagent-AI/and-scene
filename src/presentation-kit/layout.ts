import type { CSSProperties } from 'react'

/*
 * Layout geometry only. Every value here positions content; none chooses a
 * color, font, border, or spacing scale. Presentations style their own look.
 */

export const rootStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
}

export const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flex: 'none',
}

export const bodyStyle: CSSProperties = {
  display: 'flex',
  flex: '1 1 auto',
  minHeight: 0,
}

export const stageStyle: CSSProperties = {
  position: 'relative',
  flex: '1 1 auto',
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

export const footerStyle: CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
}

export const controlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

export const progressStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

export const layerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
}

export const attributionStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  bottom: 8,
}

/** Absolute placement of a diagram node in design-canvas units. */
export function place(x: number, y: number, width: number, height: number): CSSProperties {
  return { position: 'absolute', left: x, top: y, width, height }
}
