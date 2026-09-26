import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
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
    const exampleDir = path.join(project, 'src/presentations/example')
    await mkdir(exampleDir, { recursive: true })
    await cp(path.join(skillRoot, 'templates/presentation/Talk.tsx'), path.join(exampleDir, 'Talk.tsx'))
    await cp(path.join(skillRoot, 'templates/presentation/steps.tsx'), path.join(exampleDir, 'steps.tsx'))
    const registryPath = path.join(project, 'src/presentations/index.ts')
    const registry = await readFile(registryPath, 'utf8')
    await writeFile(registryPath, registry.replace('export const presentations: readonly PresentationEntry[] = [', 'export const presentations: readonly PresentationEntry[] = [\n  { slug: \'example\', title: \'Example\', load: () => import(\'./example/Talk.js\') },'))

    const verify = run('npm', ['--prefix', project, 'run', 'verify'], tmpdir())
    expect(verify.status, verify.stdout + verify.stderr).toBe(0)
    expect(verify.stdout).toContain('PASS: /starter rendered cleanly')
    expect(verify.stdout).toContain('PASS: /example rendered cleanly')
    expect(verify.stdout).toContain('PASS: build and all 2 registered presentation routes rendered cleanly')

    const inspect = run('npm', ['--prefix', project, 'run', 'inspect', '--', 'example'], tmpdir())
    expect(inspect.status, inspect.stdout + inspect.stderr).toBe(0)
    expect(await stat(path.join(project, 'artifacts/presentation-inspection/example/step-01.png'))).toBeDefined()
  }, 240_000)
})
