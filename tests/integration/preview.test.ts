import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { HOST, freePort, startPreview } from '../../scripts/lib/preview.mjs'
import { portIsFree } from '../support/project'

const scratchRoot = path.resolve(__dirname, '../.tmp')
mkdirSync(scratchRoot, { recursive: true })
const site = mkdtempSync(path.join(scratchRoot, 'preview-'))
mkdirSync(path.join(site, 'dist'))
writeFileSync(path.join(site, 'dist/index.html'), '<!doctype html><title>x</title>')
writeFileSync(path.join(site, 'package.json'), '{"type":"module"}')
afterAll(() => rmSync(site, { recursive: true, force: true }))

describe('preview process lifecycle', () => {
  it('serves on the 127.0.0.1 loopback and releases the port when stopped', async () => {
    const preview = await startPreview(site)
    expect(HOST).toBe('127.0.0.1')
    expect(preview.url).toBe(`http://127.0.0.1:${preview.port}`)
    expect((await fetch(`${preview.url}/`)).status).toBe(200)
    expect(await portIsFree(preview.port)).toBe(false)
    await preview.stop()
    expect(await portIsFree(preview.port)).toBe(true)
  })

  it('picks a free port each time', async () => {
    const [a, b] = [await freePort(), await freePort()]
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(0)
  })

  it('fails with a clear message when vite cannot be resolved', async () => {
    await expect(startPreview(path.parse(site).root)).rejects.toThrow(/vite is not installed/)
  })

  it.each([
    ['SIGTERM', 143],
    ['SIGINT', 130],
  ] as const)('stops the preview and exits %s-style when the script is interrupted', async (signal, code) => {
    const child = spawn(process.execPath, [path.resolve(__dirname, '../support/signal-fixture.mjs'), site], { stdio: ['ignore', 'pipe', 'inherit'] })
    const port = await new Promise<number>((resolve, reject) => {
      let out = ''
      child.stdout.on('data', (chunk) => {
        out += chunk
        const match = /READY (\d+)/.exec(out)
        if (match) resolve(Number(match[1]))
      })
      child.once('exit', () => reject(new Error(`fixture exited early: ${out}`)))
    })
    expect(await portIsFree(port)).toBe(false)
    const exited = new Promise<number | null>((resolve) => child.once('exit', resolve))
    child.kill(signal)
    expect(await exited).toBe(code)
    expect(await portIsFree(port)).toBe(true)
  })
})
