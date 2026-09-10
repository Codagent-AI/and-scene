import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const root = process.cwd()

async function listen(server: Server) {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener')
  return address.port
}

function inspect(port: number, cwd = root) {
  return exec(process.execPath, ['--input-type=module', '-e', `
    import { withPresentationPage } from './scripts/lib/presentation-page.mjs'
    await withPresentationPage(${port}, 'fixture', () => console.log('INSPECTION_STARTED'))
  `], { cwd, timeout: 8000 })
}

describe('preview readiness ownership and timeouts', () => {
  it.each(['responsive', 'unresponsive'])('rejects an occupied port with an unrelated %s server', async (behavior) => {
    const server = createServer((_request, response) => {
      if (behavior === 'responsive') response.end('An unrelated application')
    })
    const port = await listen(server)
    try {
      await expect(inspect(port)).rejects.toMatchObject({
        code: 1,
        killed: false,
        stderr: expect.stringMatching(/preview.*exited/i),
        stdout: expect.not.stringContaining('INSPECTION_STARTED'),
      })
    } finally {
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }, 12000)

  it('bounds readiness requests and cleans up a live preview that never answers', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'and-scene-stalled-preview-'))
    const reservation = createServer()
    const port = await listen(reservation)
    await new Promise<void>((resolve) => reservation.close(() => resolve()))
    try {
      await cp(join(root, 'scripts'), join(directory, 'scripts'), { recursive: true })
      await mkdir(join(directory, 'node_modules/vite/bin'), { recursive: true })
      await symlink(join(root, 'node_modules/playwright'), join(directory, 'node_modules/playwright'), 'dir')
      await writeFile(join(directory, 'node_modules/vite/bin/vite.js'), `
        const { createServer } = require('node:http')
        const { writeFileSync, appendFileSync } = require('node:fs')
        writeFileSync('preview.pid', String(process.pid))
        createServer(() => appendFileSync('requests.txt', 'request\\n'))
          .listen(${port}, '127.0.0.1', () => console.log('  Local: http://127.0.0.1:${port}/'))
      `)
      await expect(inspect(port, directory)).rejects.toMatchObject({
        code: 1,
        killed: false,
        stderr: expect.stringMatching(/preview readiness failed/i),
        stdout: expect.not.stringContaining('INSPECTION_STARTED'),
      })
      const requests = (await readFile(join(directory, 'requests.txt'), 'utf8')).trim().split('\n')
      expect(requests.length).toBeGreaterThan(1)
      const pid = Number(await readFile(join(directory, 'preview.pid'), 'utf8'))
      expect(() => process.kill(pid, 0)).toThrow()
    } finally {
      // An unfixed helper is killed by the subprocess deadline; clean its child too.
      try {
        const pid = Number(await readFile(join(directory, 'preview.pid'), 'utf8'))
        process.kill(pid, 'SIGTERM')
      } catch { /* already exited */ }
      await rm(directory, { recursive: true, force: true })
    }
  }, 12000)
})
