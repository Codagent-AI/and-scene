// @vitest-environment node
import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ spawn: vi.fn(), launch: vi.fn(), delay: vi.fn(async (_ms: number, _value?: unknown, _options?: { ref: boolean }) => undefined) }))
vi.mock('node:child_process', () => ({ spawn: mock.spawn, spawnSync: vi.fn() }))
vi.mock('node:timers/promises', () => ({ setTimeout: mock.delay }))
vi.mock('node:net', () => ({ createServer: () => ({
  on: vi.fn(), listen: (_port: number, _host: string, callback: () => void) => callback(),
  address: () => ({ port: 4173 }), close: (callback: () => void) => callback(),
}) }))
vi.mock('playwright', () => ({ chromium: { launch: mock.launch } }))
import { preview } from '../scripts/browser.mjs'
class FakeChild extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  exitCode: number | null = null
  signalCode: string | null = null
  pid: number | undefined = 42
  kill = vi.fn((_signal: string) => { this.exitCode = 0; this.emit('exit', 0); return true })
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })))
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
it('R1 spawn errors without exit reject promptly and do not try to kill a nonexistent child', async () => {
  const child = new FakeChild(); child.pid = undefined
  mock.spawn.mockImplementation(() => { queueMicrotask(() => child.emit('error', new Error('ENOENT: missing cwd'))); return child })
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
  await expect(preview('/missing')).rejects.toThrow('preview: failed to start Error: ENOENT: missing cwd')
  expect(child.kill).not.toHaveBeenCalled()
  expect(mock.delay.mock.calls.some(call => Number(call[0]) === 2000)).toBe(false)
})
it('R1 cleanup bounds the final wait if a child never emits exit after either signal', async () => {
  const child = new FakeChild(); child.kill.mockImplementation(() => true)
  mock.spawn.mockReturnValue(child)
  const server = await preview('/app')
  await server.stop()
  expect(child.kill.mock.calls).toEqual([['SIGTERM'], ['SIGKILL']])
  expect(mock.delay).toHaveBeenCalledTimes(2)
  expect(mock.delay).toHaveBeenLastCalledWith(2000, undefined, { ref: false })
})
