import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { withBrowser } from '../scripts/browser-runtime.mjs'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('node:net', () => ({ createServer: () => ({ once() {}, listen(_port: number, _host: string, done: () => void) { done() }, address: () => ({ port: 43210 }), close(done: () => void) { done() } }) }))
vi.mock('playwright', () => ({ chromium: { launch: vi.fn() } }))

class Preview extends EventEmitter {
  stdout = new PassThrough()
  stderr = new PassThrough()
  exitCode: number | null = null
  pid: number | undefined = 12345
  kill = vi.fn(() => { this.exitCode = 0; queueMicrotask(() => this.emit('exit', 0)); return true })
}

describe('preview cleanup failures', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
  it('terminates preview even when closing Chromium fails', async () => {
    const preview = new Preview()
    vi.mocked(spawn).mockReturnValue(preview as unknown as ReturnType<typeof spawn>)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const close = vi.fn().mockRejectedValue(new Error('browser-close failure'))
    vi.mocked(chromium.launch).mockResolvedValue({ newPage: vi.fn().mockResolvedValue({}), close } as unknown as Awaited<ReturnType<typeof chromium.launch>>)
    await expect(withBrowser('/project', async () => {})).rejects.toThrow('browser-close failure')
    expect(close).toHaveBeenCalledOnce()
    expect(preview.kill).toHaveBeenCalledWith('SIGTERM')
  })
  it('reports a preview spawn error without waiting for a nonexistent process', async () => {
    const preview = new Preview()
    preview.pid = undefined
    vi.mocked(spawn).mockImplementation(() => { queueMicrotask(() => preview.emit('error', new Error('spawn denied'))); return preview as unknown as ReturnType<typeof spawn> })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('not ready')))
    await expect(withBrowser('/project', async () => {})).rejects.toThrow('preview: spawn denied')
    expect(preview.kill).not.toHaveBeenCalled()
  })
})
