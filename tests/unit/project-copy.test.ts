import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { announcedPort, hasLeakedProcess, isPortClosed } from '../helpers/project-copy'

// The leak detectors back the cleanup assertions in the integration and end-to-end suites.
describe('process leak detection', () => {
  it('finds a live process running from the directory regardless of its command line, and stops after it exits', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leak-'))
    expect(hasLeakedProcess(dir)).toBe(false)
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: dir, stdio: 'ignore' })
    await new Promise((r) => setTimeout(r, 200))
    expect(hasLeakedProcess(dir)).toBe(true)
    const exited = new Promise((r) => child.once('exit', r))
    child.kill('SIGKILL')
    await exited
    expect(hasLeakedProcess(dir)).toBe(false)
  })

  it('reports whether a loopback port is accepting connections', async () => {
    const server = net.createServer()
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    const { port } = server.address() as net.AddressInfo
    expect(await isPortClosed(port)).toBe(false)
    await new Promise((r) => server.close(r))
    expect(await isPortClosed(port)).toBe(true)
  })

  it('reads the announced preview port from verify output', () => {
    expect(announcedPort('ok build\nok preview http://127.0.0.1:4173\n')).toBe(4173)
    expect(announcedPort('ok build\nFAIL build')).toBeNull()
  })
})
