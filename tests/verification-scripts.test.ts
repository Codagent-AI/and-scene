import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain-JS helper shared by the browser-driving scripts
import { previewStarted } from '../scripts/preview.mjs'

const root = join(import.meta.dirname, '..')

describe('browser verification script contracts', () => {
  it('uses native filesystem paths for both browser scripts', async () => {
    const verify = await readFile(join(root, 'scripts/verify.mjs'), 'utf8')
    const inspect = await readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(verify).toContain("import { fileURLToPath } from 'node:url'")
    expect(inspect).toContain("import { fileURLToPath } from 'node:url'")
    expect(verify).toContain('fileURLToPath(new URL')
    expect(inspect).toContain('fileURLToPath(new URL')
  })

  it('inspection owns the preview lifecycle', async () => {
    const inspect = await readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(inspect).toContain("spawn('npm'")
    expect(inspect).toContain("['run', 'build']")
    expect(inspect).toContain('waitForPreview(preview, previewMonitor.failure)')
    expect(inspect).toContain('preview.kill')
  })

  it('verification waits for its own preview process before HTTP readiness', async () => {
    const verify = await readFile(join(root, 'scripts/verify.mjs'), 'utf8')
    expect(verify).toContain('previewStarted(output)')
    expect(verify).toContain('if (started)')
    expect(verify).toContain('preview.exitCode')
  })

  it('detects preview startup in colorized vite output', () => {
    const plain = '  \u2192  Local:   http://127.0.0.1:4173/\n'
    const colorized = '  \u001b[32m\u2192\u001b[39m  \u001b[1mLocal\u001b[22m:   \u001b[36mhttp://127.0.0.1:\u001b[1m4173\u001b[22m/\u001b[39m\n'
    expect(previewStarted(plain)).toBe(true)
    expect(previewStarted(colorized)).toBe(true)
    expect(previewStarted('> vite preview --host 127.0.0.1 --port 4173\n')).toBe(false)
    expect(previewStarted('http://127.0.0.1:5173/')).toBe(false)
  })

  it('verification monitors preview failures through the final browser assertion', async () => {
    const verify = await readFile(join(root, 'scripts/verify.mjs'), 'utf8')
    expect(verify).toContain("preview.once('error'")
    expect(verify).toContain("preview.once('exit'")
    expect(verify).toContain('Promise.race')
    expect(verify).toContain('preview.signalCode')
  })

  it('inspection terminates the complete preview process tree on Windows', async () => {
    const inspect = await readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(inspect).toContain("taskkill")
    expect(inspect).toContain("['/PID', String(preview.pid), '/T', '/F']")
    expect(inspect).toContain('await terminatePreview(preview)')
  })

  it('kills the POSIX preview process group even after the parent exits', async () => {
    const verify = await readFile(join(root, 'scripts/verify.mjs'), 'utf8')
    const inspect = await readFile(join(root, 'scripts/inspect-presentation.mjs'), 'utf8')
    for (const script of [verify, inspect]) {
      expect(script).toContain("if (process.platform !== 'win32' && preview.pid)")
      expect(script).toContain("process.kill(-preview.pid, 'SIGTERM')")
      expect(script).toContain("error.code !== 'ESRCH'")
    }
  })
})
