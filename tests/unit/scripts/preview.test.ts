import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST, PhaseError, findFreePort, previewArgs, previewUrl, runCommand, stopProcess, waitForHttp } from '../../../scripts/lib/preview.mjs'

describe('IPv4 loopback', () => {
  it('derives the preview bind, readiness URL and browser URL from one 127.0.0.1 host', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(previewArgs(4173)).toEqual(['preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'])
    expect(previewUrl(4173)).toBe('http://127.0.0.1:4173/')
    expect(previewUrl(4173, '/talk')).toBe('http://127.0.0.1:4173/talk')
  })

  it.each(['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs'])('%s never falls back to localhost', (file) => {
    const source = readFileSync(join(process.cwd(), 'scripts', file), 'utf8')
    expect(source).not.toMatch(/localhost|\[::1\]|0\.0\.0\.0/)
  })

  it('finds a free port on the loopback address', async () => {
    const port = await findFreePort()
    expect(port).toBeGreaterThan(1023)
  })
})

describe('runCommand', () => {
  it('resolves with the output of a successful command', async () => {
    expect(await runCommand(process.execPath, ['-e', 'console.log("hi")'], { cwd: process.cwd(), phase: 'build' })).toContain('hi')
  })

  it('rejects with the phase and the command output on a non-zero exit', async () => {
    const failure = runCommand(process.execPath, ['-e', 'console.error("bad"); process.exit(3)'], { cwd: process.cwd(), phase: 'build' })
    await expect(failure).rejects.toMatchObject({ phase: 'build', message: expect.stringContaining('bad') })
    await expect(failure).rejects.toBeInstanceOf(PhaseError)
  })

  it('rejects when the command cannot start', async () => {
    await expect(runCommand('definitely-not-a-command', [], { cwd: process.cwd(), phase: 'build' })).rejects.toMatchObject({ phase: 'build' })
  })
})

describe('waitForHttp', () => {
  it('retries until the server answers', async () => {
    let calls = 0
    const fetchImpl = (async () => {
      calls++
      if (calls < 3) throw new Error('refused')
      return { ok: true } as Response
    }) as typeof fetch
    await waitForHttp('http://127.0.0.1:1/', { intervalMs: 1, fetchImpl })
    expect(calls).toBe(3)
  })

  it('fails the preview phase when the server never becomes ready', async () => {
    const fetchImpl = (async () => ({ ok: false, status: 503 }) as Response) as typeof fetch
    await expect(waitForHttp('http://127.0.0.1:1/', { timeoutMs: 40, intervalMs: 5, fetchImpl })).rejects.toMatchObject({
      phase: 'preview',
      message: expect.stringContaining('HTTP 503'),
    })
  })
})

describe('stopProcess', () => {
  it('waits until the child has actually exited', async () => {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'])
    await new Promise((resolve) => setTimeout(resolve, 100))
    await stopProcess(child)
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true)
  })

  it('escalates to SIGKILL when the child ignores SIGTERM', async () => {
    const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000); console.log("ready")'])
    await new Promise((resolve) => child.stdout.once('data', resolve))
    await stopProcess(child, 100)
    expect(child.signalCode).toBe('SIGKILL')
  })

  it('is a no-op for a missing or already finished child', async () => {
    await stopProcess(undefined as never)
    const child = spawn(process.execPath, ['-e', ''])
    await new Promise((resolve) => child.once('exit', resolve))
    await stopProcess(child)
  })
})
