import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { tmpDir } from './helpers'
import { findFreePort, HOST, installCleanup, isPidAlive, killGroup } from '../../scripts/lib/preview.mjs'

class FakeProc extends EventEmitter {
  exit = vi.fn()
}

describe('preview cleanup', () => {
  it('runs stop at most once however it is triggered', async () => {
    const proc = new FakeProc()
    const stop = vi.fn(async () => {})
    const run = installCleanup(stop, proc as unknown as NodeJS.Process)
    await run()
    await run()
    proc.emit('exit')
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ])('stops the preview and exits on %s', async (signal, code) => {
    const proc = new FakeProc()
    const stop = vi.fn(async () => {})
    installCleanup(stop, proc as unknown as NodeJS.Process)
    proc.emit(signal)
    await vi.waitFor(() => expect(proc.exit).toHaveBeenCalledWith(code))
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('still triggers stop on process exit if nothing ran it before', () => {
    const proc = new FakeProc()
    const stop = vi.fn()
    installCleanup(stop, proc as unknown as NodeJS.Process)
    proc.emit('exit')
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('kills a detached process group, including grandchildren', async () => {
    const pidFile = path.join(tmpDir(), 'grandchild.pid')
    const child = spawn('sh', ['-c', `sleep 60 & echo $! > ${pidFile}; wait`], { detached: true, stdio: 'ignore' })
    await vi.waitFor(() => expect(fs.existsSync(pidFile) && fs.readFileSync(pidFile, 'utf8')).toBeTruthy())
    const grandchild = Number(fs.readFileSync(pidFile, 'utf8'))
    expect(isPidAlive(child.pid!)).toBe(true)
    await killGroup(child.pid!)
    await vi.waitFor(() => expect(isPidAlive(child.pid!)).toBe(false))
    // A killed orphan may linger as a zombie until its reaper runs; it is no longer running.
    const state = () => (fs.existsSync(`/proc/${grandchild}/stat`) ? fs.readFileSync(`/proc/${grandchild}/stat`, 'utf8').split(') ')[1][0] : 'gone')
    await vi.waitFor(() => expect(['gone', 'Z']).toContain(state()))
  })

  it('escalates to SIGKILL when SIGTERM is ignored', async () => {
    const child = spawn('sh', ['-c', "trap '' TERM; while true; do sleep 1; done"], { detached: true, stdio: 'ignore' })
    await new Promise((r) => setTimeout(r, 200))
    await killGroup(child.pid!, { graceMs: 200 })
    await vi.waitFor(() => expect(isPidAlive(child.pid!)).toBe(false))
  })

  it('tolerates an already-gone group', async () => {
    await expect(killGroup(2 ** 22 - 7)).resolves.toBeUndefined()
  })

  it('picks a free IPv4 loopback port', async () => {
    expect(HOST).toBe('127.0.0.1')
    expect(await findFreePort()).toBeGreaterThan(0)
  })
})
