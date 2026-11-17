import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
import { withPreview } from '../scripts/browser.mjs'
vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:net', () => ({ createServer: vi.fn() }))
vi.mock('playwright', () => ({ chromium: { launchServer: vi.fn(), connect: vi.fn() } }))
function processDouble(pid: number) {
  return Object.assign(new EventEmitter(), {
    pid, exitCode: null as number | null, signalCode: null as string | null,
    stdout: new EventEmitter(), stderr: new EventEmitter(),
    kill: vi.fn(function (this: { signalCode: string | null; emit: (name: string, ...args: unknown[]) => void }, signal: string) {
      this.signalCode = signal
      this.emit('exit', null, signal)
      return true
    }),
  })
}
let server: ReturnType<typeof processDouble>
let browserProcess: ReturnType<typeof processDouble>
const browser = { close: vi.fn() }
const browserServer = { close: vi.fn(), process: vi.fn(), wsEndpoint: () => 'ws://127.0.0.1/mock' }
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  server = processDouble(101)
  browserProcess = processDouble(102)
  const socket = Object.assign(new EventEmitter(), {
    listen: vi.fn(function (this: EventEmitter) { queueMicrotask(() => this.emit('listening')) }),
    address: () => ({ port: 1234 }), close: (done: () => void) => done(),
  })
  vi.mocked(createServer).mockReturnValue(socket as unknown as ReturnType<typeof createServer>)
  vi.mocked(spawn).mockReturnValue(server as unknown as ReturnType<typeof spawn>)
  browser.close.mockResolvedValue(undefined)
  browserServer.close.mockImplementation(async () => { browserProcess.exitCode = 0; browserProcess.emit('exit', 0) })
  browserServer.process.mockReturnValue(browserProcess)
  vi.mocked(chromium.launchServer).mockResolvedValue(browserServer as unknown as Awaited<ReturnType<typeof chromium.launchServer>>)
  vi.mocked(chromium.connect).mockResolvedValue(browser as unknown as Awaited<ReturnType<typeof chromium.connect>>)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
it('R1 already-signalled preview rejects promptly without waiting for a past exit', async () => {
  server.signalCode = 'SIGKILL'
  server.emit('exit', null, 'SIGKILL')
  const action = vi.fn()
  await expect(withPreview('/app', action)).rejects.toThrow('preview phase: exited SIGKILL')
  expect(server.kill).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
  expect(action).not.toHaveBeenCalled()
}, 1000)
it('R1 preview signalled during rendering preserves failure and still closes browser', async () => {
  await expect(withPreview('/app', async () => {
    server.signalCode = 'SIGKILL'
    server.emit('exit', null, 'SIGKILL')
    throw new Error('original render failure')
  })).rejects.toThrow('original render failure')
  expect(server.kill).not.toHaveBeenCalled()
  expect(browser.close).toHaveBeenCalledOnce()
  expect(browserServer.close).toHaveBeenCalledOnce()
}, 1000)
it('R1 running preview and browser close on success', async () => {
  await expect(withPreview('/app', async () => 'rendered')).resolves.toBe('rendered')
  expect(server.kill).toHaveBeenCalledExactlyOnceWith('SIGTERM')
  expect(browser.close).toHaveBeenCalledOnce()
  expect(browserServer.close).toHaveBeenCalledOnce()
})
it('R1 normally exited preview is not killed again', async () => {
  server.exitCode = 1
  await expect(withPreview('/app', vi.fn())).rejects.toThrow('preview phase: exited 1')
  expect(server.kill).not.toHaveBeenCalled()
})
