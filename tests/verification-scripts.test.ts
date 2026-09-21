import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain-JS helper shared by the browser-driving scripts
import { previewStarted } from '../scripts/preview.mjs'

const root = join(import.meta.dirname, '..')
const read = (path: string) => readFile(join(root, path), 'utf8')

describe('preview readiness', () => {
  it('detects preview startup in plain and colorized vite output', () => {
    const plain = '  →  Local:   http://127.0.0.1:4173/\n'
    const colorized = '  \u001b[32m→\u001b[39m  \u001b[1mLocal\u001b[22m:   \u001b[36mhttp://127.0.0.1:\u001b[1m4173\u001b[22m/\u001b[39m\n'
    expect(previewStarted(plain)).toBe(true)
    expect(previewStarted(colorized)).toBe(true)
  })

  it('does not treat the spawn command or another port as a started preview', () => {
    expect(previewStarted('> vite preview --host 127.0.0.1 --port 4173\n')).toBe(false)
    expect(previewStarted('http://127.0.0.1:5173/')).toBe(false)
  })
})

describe('browser verification script contracts', () => {
  it('uses native filesystem paths for both browser scripts', async () => {
    for (const path of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      const script = await read(path)
      expect(script).toContain("import { fileURLToPath } from 'node:url'")
      expect(script).toContain('fileURLToPath(new URL')
    }
  })

  it('drives the preview lifecycle through the shared module instead of its own spawn', async () => {
    for (const path of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      const script = await read(path)
      expect(script).toContain('await startPreview(root)')
      expect(script).toContain('await preview.stop()')
      expect(script).not.toContain("spawn('npm', ['run', 'preview'")
    }
  })

  it('inspection builds before it inspects', async () => {
    expect(await read('scripts/inspect-presentation.mjs')).toContain("run('npm', ['run', 'build'], root)")
  })

  it('waits for its own preview process before accepting HTTP readiness', async () => {
    const preview = await read('scripts/preview.mjs')
    expect(preview).toContain('started ||= previewStarted(output)')
    expect(preview).toContain('if (started)')
    expect(preview).toContain('child.exitCode')
  })

  it('monitors preview failure so browser work cannot outlive the server', async () => {
    const preview = await read('scripts/preview.mjs')
    expect(preview).toContain("child.once('error'")
    expect(preview).toContain("child.once('exit'")
    expect(preview).toContain('Promise.race')
    expect(preview).toContain('child.signalCode')
  })

  it('terminates the complete preview process tree on Windows', async () => {
    const preview = await read('scripts/preview.mjs')
    expect(preview).toContain('taskkill')
    expect(preview).toContain("['/PID', String(child.pid), '/T', '/F']")
  })

  it('kills the POSIX preview process group even after the parent exits', async () => {
    const preview = await read('scripts/preview.mjs')
    expect(preview).toContain("process.kill(-child.pid, 'SIGTERM')")
    expect(preview).toContain("error.code !== 'ESRCH'")
  })
})
