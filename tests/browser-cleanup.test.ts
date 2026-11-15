// @vitest-environment node
import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ spawn: vi.fn(), launch: vi.fn(), delay: vi.fn<(ms: number, value?: unknown, options?: { ref: boolean }) => Promise<void>>().mockResolvedValue(undefined) }))
vi.mock('node:child_process', () => ({ spawn: mock.spawn, spawnSync: vi.fn() }))
vi.mock('node:timers/promises', () => ({ setTimeout: mock.delay }))
vi.mock('node:net', () => ({ createServer: () => ({
  on: vi.fn(), listen: (_port: number, _host: string, callback: () => void) => callback(),
  address: () => ({ port: 4173 }), close: (callback: () => void) => callback(),
}) }))
vi.mock('playwright', () => ({ chromium: { launch: mock.launch } }))
import { preview, withBrowser } from '../scripts/browser.mjs'
class FakeChild extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  exitCode: number | null = null
  signalCode: string | null = null
  pid: number | undefined = 42
  kill = vi.fn<(signal: string) => boolean>(() => { this.exitCode = 0; this.emit('exit', 0); return true })
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
it('R2 browser close rejection still stops preview and preserves the callback error', async () => {
  const child = new FakeChild(); mock.spawn.mockReturnValue(child)
  const close = vi.fn().mockRejectedValue(new Error('disconnected target'))
  mock.launch.mockResolvedValue({ newPage: vi.fn().mockResolvedValue({ setDefaultTimeout: vi.fn() }), close })
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  const original = new Error('original render failure')
  await expect(withBrowser('/app', async () => { throw original })).rejects.toBe(original)
  expect(close).toHaveBeenCalledTimes(1)
  expect(child.kill).toHaveBeenCalledWith('SIGTERM')
  expect(child.exitCode).toBe(0)
  expect(warning).toHaveBeenCalledWith('cleanup: browser close failed: disconnected target')
})
it('R2 close failure after a successful callback reports cleanup failure after stopping preview', async () => {
  const child = new FakeChild(); mock.spawn.mockReturnValue(child)
  mock.launch.mockResolvedValue({ newPage: vi.fn().mockResolvedValue({ setDefaultTimeout: vi.fn() }), close: vi.fn().mockRejectedValue(new Error('close failed')) })
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  await expect(withBrowser('/app', async () => 'render passed')).rejects.toThrow('cleanup: browser close failed: close failed')
  expect(child.kill).toHaveBeenCalledWith('SIGTERM')
  expect(child.exitCode).toBe(0)
})
it('R2 browser launch failure preserves its error and cleans up the already-started preview', async () => {
  const child = new FakeChild(); mock.spawn.mockReturnValue(child)
  const original = new Error('Chromium launch failed'); mock.launch.mockRejectedValue(original)
  await expect(withBrowser('/app', async () => undefined)).rejects.toBe(original)
  expect(child.kill).toHaveBeenCalledWith('SIGTERM')
  expect(child.exitCode).toBe(0)
})
