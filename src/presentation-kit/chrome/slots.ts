import type { HTMLAttributes } from 'react'

/** Author-supplied props (className, style, data-*, aria-*) forwarded to a chrome part. */
export type SlotProps = HTMLAttributes<HTMLElement> & { [key: `data-${string}`]: string | undefined }

export type ChromeSlot =
  | 'root'
  | 'header'
  | 'footer'
  | 'toc'
  | 'progress'
  | 'prev'
  | 'next'
  | 'modeToggle'
  | 'stage'
  | 'canvas'
  | 'attribution'

export type ChromeSlots = Partial<Record<ChromeSlot, SlotProps>>
