import { act } from '@testing-library/react'
import { readdirSync } from 'node:fs'
import { createConnection } from 'node:net'
import { join } from 'node:path'

/** Escapes text for use inside a RegExp source. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Relative paths of every file under `root/dir`, sorted, depth-first. */
export function listFiles(root: string, dir = ''): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const rel = join(dir, entry.name)
      return entry.isDirectory() ? listFiles(root, rel) : [rel]
    })
}

/** True when something accepts TCP connections on 127.0.0.1:port. */
export function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolveOpen) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolveOpen(true)
    })
    socket.once('error', () => resolveOpen(false))
  })
}

/** Dispatches a keydown on the target inside act(), as a real key press would. */
export function press(key: string, target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}
