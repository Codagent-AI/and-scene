import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { startPreview } from '../../scripts/preview-process.mjs'

function fakeChild() {
  const child = new EventEmitter() as EventEmitter & { stdout: PassThrough; exitCode: number | null }
  child.stdout = new PassThrough()
  child.exitCode = null
  return child
}

describe('preview process readiness', () => {
  it('uses only the URL announced by the child started on an ephemeral port', async () => {
    const child = fakeChild()
    let command: string | undefined
    let args: unknown
    const started = startPreview('/vite.js', '/project', (exe, argv) => {
      command = exe
      args = argv
      return child as never
    })

    expect(command).toBe(process.execPath)
    expect(args).toContain('--host')
    expect(args).toContain('127.0.0.1')
    expect(args).toContain('--port')
    expect(args).toContain('0')

    child.stdout.write('HTTP/1.1 200 OK from another process\n')
    let settled = false
    void started.ready.then(() => { settled = true })
    await new Promise((resolve) => setImmediate(resolve))
    expect(settled).toBe(false)

    child.stdout.write('  Local:   http://127.0.0.1:43127/\n')
    await expect(started.ready).resolves.toMatchObject({ url: 'http://127.0.0.1:43127' })
  })

  it('rejects when the child exits before announcing its URL', async () => {
    const child = fakeChild()
    const started = startPreview('/vite.js', '/project', () => child as never)
    child.emit('exit', 1, null)
    await expect(started.ready).rejects.toThrow('preview exited with code 1 before reporting its URL')
  })
})
