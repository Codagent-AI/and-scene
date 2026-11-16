import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
import { withPreview } from '../scripts/browser.mjs'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:net', () => ({ createServer: vi.fn() }))
vi.mock('playwright', () => ({ chromium: { launchServer: vi.fn(), connect: vi.fn() } }))

const signals = new Map<string, () => void>()
let child: EventEmitter & { pid: number | undefined; exitCode: number | null; stderr: EventEmitter; stdout: { resume: () => void } }
let browser: { close: ReturnType<typeof vi.fn>; newPage: ReturnType<typeof vi.fn> }
let server: { close: ReturnType<typeof vi.fn>; process: () => { pid: number }; wsEndpoint: () => string }
let kill: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  signals.clear()
  child = Object.assign(new EventEmitter(), { pid: 12345 as number | undefined, exitCode: null as number | null, stderr: new EventEmitter(), stdout: { resume: vi.fn() } })
  browser = { close: vi.fn(async () => {}), newPage: vi.fn(async () => ({})) }
  server = { close: vi.fn(async () => {}), process: () => ({ pid: 23456 }), wsEndpoint: () => 'ws://127.0.0.1/unit-test' }
  vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>)
  vi.mocked(chromium.launchServer).mockResolvedValue(server as unknown as Awaited<ReturnType<typeof chromium.launchServer>>)
  vi.mocked(chromium.connect).mockResolvedValue(browser as unknown as Awaited<ReturnType<typeof chromium.connect>>)
  const port = Object.assign(new EventEmitter(), {
    listen: vi.fn(() => queueMicrotask(() => port.emit('listening'))),
    address: () => ({ port: 4173 }),
    close: (callback: () => void) => callback(),
  })
  vi.mocked(createServer).mockReturnValue(port as unknown as ReturnType<typeof createServer>)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })))
  kill = vi.spyOn(process, 'kill').mockImplementation(() => {
    child.exitCode = 0
    queueMicrotask(() => child.emit('exit', 0))
    return true
  })
  const once = process.once.bind(process)
  const remove = process.removeListener.bind(process)
  vi.spyOn(process, 'once').mockImplementation((name, callback) => {
    if (name === 'SIGINT' || name === 'SIGTERM') { signals.set(name, callback); return process }
    return once(name, callback)
  })
  vi.spyOn(process, 'removeListener').mockImplementation((name, callback) => {
    if ((name === 'SIGINT' || name === 'SIGTERM') && signals.get(name) === callback) { signals.delete(name); return process }
    return remove(name, callback)
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('R2 preview interruption lifecycle (mocked processes and browser)', () => {
  it.each(['SIGINT', 'SIGTERM'])('R2 %s aborts a pending callback and closes all resources promptly', async signal => {
    let entered!: () => void
    const running = new Promise<void>(resolve => { entered = resolve })
    const callback = vi.fn(() => { entered(); return new Promise(() => {}) })
    const result = withPreview(callback)
    const rejection = expect(result).rejects.toThrow(`Interrupted by ${signal}`)
    await running
    signals.get(signal)!()
    await rejection
    expect(callback).toHaveBeenCalledOnce()
    expect(chromium.launchServer).toHaveBeenCalledWith(expect.objectContaining({ handleSIGINT: false, handleSIGTERM: false }))
    expect(browser.close).toHaveBeenCalledOnce()
    expect(server.close).toHaveBeenCalledOnce()
    expect(kill).toHaveBeenCalledWith(-12345, 'SIGTERM')
    expect(signals.size).toBe(0)
  })
  it('R2 aborts an in-flight readiness probe without launching Chromium', async () => {
    let entered!: () => void
    const probing = new Promise<void>(resolve => { entered = resolve })
    vi.mocked(fetch).mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options!.signal!.addEventListener('abort', () => reject(options!.signal!.reason), { once: true })
      entered()
    }))
    const result = withPreview(vi.fn())
    const rejection = expect(result).rejects.toThrow('Interrupted by SIGINT')
    await probing
    signals.get('SIGINT')!()
    await rejection
    expect(chromium.launchServer).not.toHaveBeenCalled()
    expect(kill).toHaveBeenCalledWith(-12345, 'SIGTERM')
    expect(signals.size).toBe(0)
  })
  it('R2 preserves a spawn error with no PID and never calls process.kill with NaN', async () => {
    const original = new Error('preview spawn failed')
    child.pid = undefined
    vi.mocked(spawn).mockImplementation(() => {
      queueMicrotask(() => child.emit('error', original))
      return child as unknown as ReturnType<typeof spawn>
    })
    await expect(withPreview(vi.fn())).rejects.toBe(original)
    expect(kill).not.toHaveBeenCalled()
    expect(chromium.launchServer).not.toHaveBeenCalled()
    expect(signals.size).toBe(0)
  })
  it('R2 successful callbacks still close browser, preview, and signal handlers', async () => {
    await expect(withPreview(async () => 'done')).resolves.toBe('done')
    expect(browser.close).toHaveBeenCalledOnce()
    expect(server.close).toHaveBeenCalledOnce()
    expect(kill).toHaveBeenCalledWith(-12345, 'SIGTERM')
    expect(signals.size).toBe(0)
  })
})
