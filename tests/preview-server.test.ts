import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const helpers = ['scripts/preview-server.mjs', 'skills/presentation/templates/bootstrap/scripts/preview-server.mjs']

// Stand-in for vite that splits the colorized banner URL mid-escape-sequence across two stdout writes.
const splitBannerVite = `const http = require('node:http')
const port = Number(process.argv[process.argv.indexOf('--port') + 1])
const server = http.createServer((request, response) => response.end('ok')).listen(port, '127.0.0.1', () => {
  process.stdout.write('  Local:   http://127.0.0.1:\\x1b[')
  setTimeout(() => process.stdout.write('1m' + port + '\\x1b[22m/\\n'), 100)
})
process.on('SIGTERM', () => server.close(() => process.exit(0)))
`

async function startsPreview(helper: string, prepare: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(path.join(tmpdir(), 'and-scene-preview-'))
  try {
    await prepare(directory)
    const script = `const { startPreview } = await import(${JSON.stringify(path.join(root, helper))}); const preview = await startPreview(4185); console.log('ready'); await preview.stop()`
    const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: directory,
      env: { ...process.env, CI: '1', FORCE_COLOR: '1' },
      timeout: 30_000,
    })
    return stdout
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

describe('preview server readiness', () => {
  it.each(helpers)('%s starts when CI or FORCE_COLOR colorize vite output', async (helper) => {
    expect(await startsPreview(helper, async (directory) => {
      await mkdir(path.join(directory, 'dist'))
      await writeFile(path.join(directory, 'dist/index.html'), '<!doctype html><title>ok</title>')
      await symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
    })).toContain('ready')
  }, 40_000)

  it.each(helpers)('%s starts when an ANSI sequence in the URL spans stdout chunks', async (helper) => {
    expect(await startsPreview(helper, async (directory) => {
      await mkdir(path.join(directory, 'node_modules/vite/bin'), { recursive: true })
      await writeFile(path.join(directory, 'node_modules/vite/bin/vite.js'), splitBannerVite)
    })).toContain('ready')
  }, 40_000)
})
