import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { createFaultFixture } from './verify-fault-fixture.mjs'

test('inspection stops its production preview when screenshots finish', async () => {
  const fixture = await createFaultFixture()
  try {
    const result = await new Promise((resolveRun, reject) => {
      const child = spawn(process.execPath, [resolve(fixture.directory, 'scripts/inspect-presentation.mjs'), 'how-to-make-a-presentation'])
      let output = ''
      child.stdout.on('data', (chunk) => { output += chunk })
      child.stderr.on('data', (chunk) => { output += chunk })
      child.once('error', reject)
      child.once('exit', (code) => resolveRun({ code, output }))
    })
    expect(result.code).toBe(0)
    const url = result.output.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0]
    expect(url).toBeTruthy()
    await expect.poll(async () => {
      try { await fetch(url); return true } catch { return false }
    }, { timeout: 2000 }).toBe(false)
  } finally {
    await fixture.cleanup()
  }
}, 30_000)
