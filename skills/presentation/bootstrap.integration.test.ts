import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const skillRoot = path.dirname(fileURLToPath(import.meta.url))
const tempProjects: string[] = []
const run = (command: string, args: string[], cwd: string) => spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 180_000, maxBuffer: 8 * 1024 * 1024 })

afterAll(async () => {
  await Promise.all(tempProjects.map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('materialized presentation bootstrap (INT-001)', () => {
  it('installs, builds, and verifies its registered route from outside the authoring checkout', async () => {
    const project = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
    tempProjects.push(project)
    const template = path.join(skillRoot, 'templates/bootstrap')
    await cp(template, project, { recursive: true })
    const lock = JSON.parse(await readFile(path.join(project, 'package-lock.json'), 'utf8'))
    expect(lock.packages['node_modules/playwright']).toBeDefined()

    const install = run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], project)
    expect(install.status, install.stdout + install.stderr).toBe(0)
    const build = run('npm', ['run', 'build'], project)
    expect(build.status, build.stdout + build.stderr).toBe(0)

    const verify = run('npm', ['--prefix', project, 'run', 'verify'], tmpdir())
    expect(verify.status, verify.stdout + verify.stderr).toBe(0)
    expect(verify.stdout).toContain('PASS: build and presentation index route rendered cleanly')
  }, 240_000)
})
