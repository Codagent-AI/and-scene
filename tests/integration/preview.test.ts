// The preview server must never outlive a failed start-up.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { freePort } from '../../scripts/lib/loopback.mjs'
import { startPreview } from '../../scripts/lib/preview.mjs'
import { cleanupTempDirs, tempDir } from '../support/repo'

afterAll(cleanupTempDirs)

/** A project whose `vite` records its pid and then behaves as scripted. */
function fakeVite(body: string) {
  const root = tempDir('preview')
  mkdirSync(path.join(root, 'node_modules/.bin'), { recursive: true })
  const bin = path.join(root, 'node_modules/.bin/vite')
  writeFileSync(bin, `#!/bin/sh\necho $$ > "${root}/pid"\n${body}\n`)
  chmodSync(bin, 0o755)
  return root
}
const alive = (root: string) => {
  const pid = Number(readFileSync(path.join(root, 'pid'), 'utf8'))
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

describe('startPreview failure cleanup', () => {
  it('rejects when the server exits before it is ready', async () => {
    const root = fakeVite('echo "boom" >&2\nexit 1')
    await expect(startPreview(root, { port: await freePort(), timeoutMs: 5000 })).rejects.toThrow(/exited early[\s\S]*boom/)
    expect(alive(root)).toBe(false)
  })

  it('kills a server that never becomes ready', async () => {
    const root = fakeVite('exec sleep 60')
    await expect(startPreview(root, { port: await freePort(), timeoutMs: 600 })).rejects.toThrow(/not ready after 600ms/)
    expect(alive(root)).toBe(false)
  })
})
