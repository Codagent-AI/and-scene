import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PhaseError, startPreview } from '../../scripts/lib/preview.mjs'

// A stand-in for node_modules/vite/bin/vite.js so the lifecycle code runs without a build.
function fakeVite(body: string) {
  const dir = mkdtempSync(path.join(tmpdir(), 'fake-vite-'))
  const bin = path.join(dir, 'node_modules/vite/bin')
  mkdirSync(bin, { recursive: true })
  writeFileSync(path.join(bin, 'vite.js'), body)
  chmodSync(path.join(bin, 'vite.js'), 0o755)
  return dir
}

const alive = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

describe('startPreview lifecycle', () => {
  it('binds the IPv4 loopback address, probes it, and reaps the process on stop()', async () => {
    const dir = fakeVite(`
      const http = require('node:http')
      const args = process.argv
      const host = args[args.indexOf('--host') + 1]
      const port = Number(args[args.indexOf('--port') + 1])
      console.log('host', host)
      http.createServer((req, res) => res.end('ok')).listen(port, host)
    `)
    const logs: string[] = []
    const preview = await startPreview({ cwd: dir, log: (m: string) => logs.push(m) })
    expect(logs[0]).toMatch(/host=127\.0\.0\.1 port=\d+/)
    expect(logs[1]).toBe(`[preview] readiness probe http://127.0.0.1:${preview.port}/ ok`)
    expect((await fetch(preview.url('/x'))).ok).toBe(true)
    await preview.stop()
    await expect(fetch(preview.url('/'))).rejects.toThrow()
  })

  it('fails with the requested phase, and nothing left running, when the preview exits early', async () => {
    const dir = fakeVite('process.exit(3)')
    const error = await startPreview({ cwd: dir, phase: 'render', log: () => {} }).catch((e) => e)
    expect(error).toBeInstanceOf(PhaseError)
    expect(error.phase).toBe('render')
    expect(error.message).toContain('exited early with code 3')
  })

  it('kills a preview that never becomes ready, within the timeout, and reports it', async () => {
    const dir = fakeVite('setInterval(() => {}, 1000)')
    const started = Date.now()
    const error = await startPreview({ cwd: dir, phase: 'preview', log: () => {}, timeoutMs: 600 }).catch((e) => e)
    expect(error).toBeInstanceOf(PhaseError)
    expect(error.message).toContain('not ready at http://127.0.0.1:')
    expect(Date.now() - started).toBeLessThan(5000)
    // the hung child was reaped by the failure path
    const { execFileSync } = await import('node:child_process')
    const ps = execFileSync('ps', ['-eo', 'pid,args'], { encoding: 'utf8' })
    const pids = ps.split('\n').filter((l) => l.includes(`${dir}/node_modules/vite/bin/vite.js`)).map((l) => Number(l.trim().split(/\s+/)[0]))
    expect(pids.filter(alive)).toEqual([])
  })
})
