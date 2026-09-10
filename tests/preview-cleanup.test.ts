import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const scripts = ['verify.mjs', 'inspect-presentation.mjs']

describe('preview subprocess cleanup', () => {
  it.each(scripts)('%s exits with an error when preview stops before readiness', async (script) => {
    const root = process.cwd()
    const directory = await mkdtemp(join(tmpdir(), 'and-scene-preview-cleanup-'))
    try {
      await cp(join(root, 'scripts'), join(directory, 'scripts'), { recursive: true })
      await mkdir(join(directory, 'node_modules/vite/bin'), { recursive: true })
      await symlink(join(root, 'node_modules/playwright'), join(directory, 'node_modules/playwright'), 'dir')
      await writeFile(join(directory, 'package.json'), JSON.stringify({ scripts: { build: 'node -e ""' } }))
      await writeFile(join(directory, 'node_modules/vite/bin/vite.js'), 'process.exit(2)\n')
      // Keep another test's preview on the same port from satisfying readiness.
      await writeFile(join(directory, 'not-ready.mjs'), 'globalThis.fetch = async () => ({ ok: false })\n')

      await expect(exec(process.execPath, ['--import', './not-ready.mjs', `scripts/${script}`, 'fixture'], {
        cwd: directory,
        timeout: 10000,
      })).rejects.toMatchObject({
        code: 1,
        killed: false,
        stderr: expect.stringMatching(/preview.*ready|preview readiness/i),
      })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 15000)
})
