/** @vitest-environment node */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { describe, expect, it } from 'vitest'
import { startPreview, terminatePreview } from '../scripts/browser-runtime.mjs'

describe('browser preview runtime', () => {
  it('reports preview spawn failures through the startup promise', async () => {
    const { child, started } = startPreview('127.0.0.1', 4173, 'missing-and-scene-npm-command')

    await expect(started).rejects.toMatchObject({ code: 'ENOENT' })
    expect(child.pid).toBeUndefined()
  })

  it.skipIf(process.platform === 'win32')('forces a bounded shutdown when SIGTERM is ignored', async () => {
    const child = spawn(
      process.execPath,
      ['-e', "process.on('SIGTERM', () => {}); process.send('ready'); setInterval(() => {}, 1_000)"],
      { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] },
    )

    try {
      await once(child, 'message')
      await Promise.race([
        terminatePreview(child, { gracefulTimeoutMs: 25, forceTimeoutMs: 1_000 }),
        delay(300).then(() => { throw new Error('preview shutdown exceeded its bound') }),
      ])
      expect(child.signalCode).toBe('SIGKILL')
    } finally {
      if (child.pid && child.exitCode === null && child.signalCode === null) {
        try { process.kill(-child.pid, 'SIGKILL') } catch { /* test child already exited */ }
      }
    }
  })
})
