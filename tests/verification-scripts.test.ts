import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

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
    expect(verify).toContain("started ||= output.includes('127.0.0.1:4173')")
    expect(verify).toContain('if (started)')
    expect(verify).toContain('preview.exitCode')
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
