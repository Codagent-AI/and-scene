import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
afterEach(cleanup)
vi.mock('motion/react', () => {
  const cache = new Map()
  const motion = new Proxy({}, { get: (_, tag: string) => {
    if (!cache.has(tag)) cache.set(tag, ({ children, layoutId, layout, initial, animate, exit, transition, ...props }: Record<string, unknown>) => React.createElement(tag, { ...props, 'data-motion': JSON.stringify({ layoutId, layout, initial, animate, exit, transition }) }, children as React.ReactNode))
    return cache.get(tag)
  } })
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => children, LayoutGroup: ({ children }: { children: React.ReactNode }) => children }
})
