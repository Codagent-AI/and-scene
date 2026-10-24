import { rmSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, copyProject, isListening, previewPort, run, type RunResult } from '../helpers/project'

// E2E-001: the reference presentation passes production verification from `npm run verify`.
describe('E2E-001 reference presentation passes production verification', () => {
  let dir: string
  let result: RunResult

  beforeAll(async () => {
    dir = copyProject()
    result = await run('npm', ['run', 'verify'], dir)
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('exits zero with a clear pass result', () => {
    expect(result.stderr).not.toMatch(/FAIL/)
    expect(result.code).toBe(0)
    expect(result.stdout).toMatch(/^PASS verify: build ok, 1 presentation\(s\), 9 step\(s\)/m)
  })

  it('renders the registered sample through all nine steps', () => {
    expect(result.stdout).toContain('verify: how-to-make-a-presentation rendered 9 steps')
    const config = JSON.parse(readFileSync(join(REPO, 'verify.config.json'), 'utf8'))
    expect(config.required[0].slug).toBe('how-to-make-a-presentation')
    expect(config.required[0].steps).toHaveLength(9)
  })

  it('serves the preview on the IPv4 loopback address only, and cleans it up', async () => {
    const port = previewPort(result.stdout)
    expect(port).not.toBeNull()
    expect(result.stdout + result.stderr).not.toMatch(/localhost/i)
    expect(readFileSync(join(REPO, 'scripts', 'verify.mjs'), 'utf8')).not.toMatch(/localhost/)
    expect(readFileSync(join(REPO, 'scripts', 'lib', 'preview.mjs'), 'utf8')).not.toMatch(/localhost/)
    expect(await isListening(port!)).toBe(false)
  })
})
