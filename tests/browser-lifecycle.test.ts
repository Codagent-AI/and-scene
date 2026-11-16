import { afterEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ server: null as unknown as import('node:events').EventEmitter & { kill: ReturnType<typeof vi.fn>; exitCode: number | null; signalCode: string | null }, closed: vi.fn(), launch: vi.fn() }))
vi.mock('node:net', async () => {
  const { EventEmitter } = await import('node:events')
  return { createServer: () => {
    const server = new EventEmitter()
    return Object.assign(server, { listen: () => queueMicrotask(() => server.emit('listening')), address: () => ({ port: 31313 }), close: (fn: () => void) => fn() })
  } }
})
vi.mock('node:child_process', async () => {
  const { EventEmitter } = await import('node:events')
  return { spawn: () => {
    const server = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter(), pid: 100, exitCode: null as number | null, signalCode: null as string | null, kill: vi.fn() })
    server.kill.mockImplementation(() => { server.exitCode = 0; server.emit('exit', 0) })
    state.server = server
    return server
  } }
})
vi.mock('playwright', () => ({ chromium: { launch: state.launch } }))
// @ts-expect-error CLI JS module shared with node tests.
import { withPreview } from '../scripts/browser.mjs'
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); state.closed.mockReset(); state.launch.mockReset() })
it('I-33 success and callback failure close browser and preview', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  state.launch.mockResolvedValue({ newPage: async () => ({}), close: state.closed })
  await withPreview(async () => 'done')
  expect(state.closed).toHaveBeenCalledTimes(1)
  expect(state.server.kill).toHaveBeenCalledWith('SIGTERM')
  await expect(withPreview(async () => { throw new Error('transition failed') })).rejects.toThrow('transition failed')
  expect(state.closed).toHaveBeenCalledTimes(2)
  expect(state.server.kill).toHaveBeenCalledWith('SIGTERM')
})
it('I-33 browser launch failure still closes preview', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  state.launch.mockRejectedValue(new Error('no browser'))
  await expect(withPreview(async () => {})).rejects.toThrow('no browser')
  expect(state.server.kill).toHaveBeenCalledWith('SIGTERM')
})
it('I-33 readiness timeout closes preview and names IPv4 origin', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('not ready')))
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  const assertion = expect(withPreview(async () => {})).rejects.toThrow('preview: readiness timeout at http://127.0.0.1:31313')
  await vi.advanceTimersByTimeAsync(16000)
  await assertion
  expect(state.server.kill).toHaveBeenCalledWith('SIGTERM')
})

it('I-33 signal exit during readiness reports failure without waiting for a past exit', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
    state.server.signalCode = 'SIGKILL'
    state.server.emit('exit', null, 'SIGKILL')
    throw new Error('server exited')
  }))
  await expect(withPreview(async () => {})).rejects.toThrow('preview: startup failed SIGKILL')
  expect(state.server.exitCode).toBeNull()
  expect(state.server.kill).not.toHaveBeenCalled()
})
it('I-33 already signaled preview preserves the work failure and closes browser', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  state.launch.mockResolvedValue({ newPage: async () => ({}), close: state.closed })
  await expect(withPreview(async () => {
    state.server.signalCode = 'SIGTERM'
    state.server.emit('exit', null, 'SIGTERM')
    throw new Error('render route failed')
  })).rejects.toThrow('render route failed')
  expect(state.closed).toHaveBeenCalledOnce()
  expect(state.server.exitCode).toBeNull()
  expect(state.server.kill).not.toHaveBeenCalled()
})
