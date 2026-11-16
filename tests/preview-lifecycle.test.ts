// @vitest-environment node
import { EventEmitter } from 'node:events'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { withBrowser } from '../scripts/lib/browser.mjs'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:net', () => ({ createServer: () => ({
  once: vi.fn(), listen: (_port: number, _host: string, ready: () => void) => ready(),
  address: () => ({ port: 12345 }), close: (done: () => void) => done(),
}) }))
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(async () => undefined) }))
vi.mock('playwright', () => ({ chromium: { launch: vi.fn() } }))

function preview() {
  const server = Object.assign(new EventEmitter(), {
    exitCode: null as number | null, signalCode: null as string | null, pid: 4321,
    stdout: new EventEmitter(), stderr: new EventEmitter(),
    kill: vi.fn((signal: string) => { server.signalCode = signal; server.emit('exit', null, signal); return true }),
  })
  vi.mocked(spawn).mockReturnValue(server as unknown as ReturnType<typeof spawn>)
  return server
}
const browser = { newPage: vi.fn(async () => ({ setDefaultTimeout: vi.fn() })), close: vi.fn(async () => undefined) }
beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(chromium.launch).mockResolvedValue(browser as unknown as Awaited<ReturnType<typeof chromium.launch>>)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })))
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks() })

describe('R1 preview exit lifecycle', () => {
  it('detects a preview already killed by a signal during readiness without waiting for another exit', async () => {
    const server = preview()
    vi.mocked(spawn).mockImplementationOnce(() => {
      queueMicrotask(() => { server.signalCode = 'SIGKILL'; server.emit('exit', null, 'SIGKILL') })
      return server as unknown as ReturnType<typeof spawn>
    })
    vi.mocked(fetch).mockRejectedValue(new Error('not ready'))
    await expect(withBrowser('/app', vi.fn())).rejects.toThrow('exited (SIGKILL)')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(server.kill).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('does not wait again when a signal exit occurred inside the browser callback', async () => {
    const server = preview()
    const outcome = await withBrowser('/app', async () => {
      server.signalCode = 'SIGTERM'; server.emit('exit', null, 'SIGTERM')
      return 'callback completed'
    })
    expect(outcome).toBe('callback completed')
    expect(browser.close).toHaveBeenCalled()
    expect(server.kill).not.toHaveBeenCalled()
  })
  it('handles synchronous exit during cleanup because the exit listener was attached at spawn', async () => {
    const server = preview()
    await expect(withBrowser('/app', async () => 'done')).resolves.toBe('done')
    expect(server.kill).toHaveBeenCalledWith('SIGTERM')
    expect(vi.getTimerCount()).toBe(0)
  })
  it('reports a spawn failure without awaiting an exit event that will never arrive', async () => {
    const server = preview()
    vi.mocked(spawn).mockImplementationOnce(() => {
      queueMicrotask(() => server.emit('error', new Error('spawn failed')))
      return server as unknown as ReturnType<typeof spawn>
    })
    vi.mocked(fetch).mockRejectedValue(new Error('not ready'))
    await expect(withBrowser('/app', vi.fn())).rejects.toThrow('spawn failed')
    expect(server.kill).not.toHaveBeenCalled()
  })
})


describe('R2 signal termination', () => {
  it.each([['SIGINT', 130], ['SIGTERM', 143]] as const)('stops the preview and exits immediately on %s', async (signal, code) => {
    const server = preview()
    const previous = process.listeners(signal)
    const exiting = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    await withBrowser('/app', async () => {
      const handler = process.listeners(signal).find(listener => !previous.includes(listener))!
      expect(handler).toBeTypeOf('function')
      handler()
      expect(server.kill).toHaveBeenCalledWith('SIGTERM')
      expect(exiting).toHaveBeenCalledWith(code)
      expect(server.kill.mock.invocationCallOrder[0]).toBeLessThan(exiting.mock.invocationCallOrder[0])
    })
    expect(process.listeners(signal)).toEqual(previous)
  })
  it('removes both signal handlers after an ordinary completion', async () => {
    preview()
    const int = process.listeners('SIGINT'), term = process.listeners('SIGTERM')
    await withBrowser('/app', async () => undefined)
    expect(process.listeners('SIGINT')).toEqual(int)
    expect(process.listeners('SIGTERM')).toEqual(term)
  })
})
