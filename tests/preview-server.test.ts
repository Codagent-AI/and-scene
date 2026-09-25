import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const helpers = ['scripts/preview-server.mjs', 'skills/presentation/templates/bootstrap/scripts/preview-server.mjs']

describe('preview server readiness', () => {
  it.each(helpers)('%s starts when CI or FORCE_COLOR colorize vite output', async (helper) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'and-scene-preview-'))
    try {
      await mkdir(path.join(directory, 'dist'))
      await writeFile(path.join(directory, 'dist/index.html'), '<!doctype html><title>ok</title>')
      await symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
      const script = `const { startPreview } = await import(${JSON.stringify(path.join(root, helper))}); const preview = await startPreview(4185); console.log('ready'); await preview.stop()`
      const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '-e', script], {
        cwd: directory,
        env: { ...process.env, CI: '1', FORCE_COLOR: '1' },
        timeout: 30_000,
      })
      expect(stdout).toContain('ready')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 40_000)
})
