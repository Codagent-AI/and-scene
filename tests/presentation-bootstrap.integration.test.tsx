import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const repo = resolve(import.meta.dirname, '..')
const template = resolve(repo, 'skills/presentation/templates/bootstrap')
let scratch = ''
let app = ''
const exec = (cmd: string, args: string[], cwd: string) => {
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 240_000 })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
}
async function files(root: string, base = root): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name)
    if (entry.isDirectory()) result.push(...(await files(path, base)))
    else result.push(relative(base, path))
  }
  return result
}

describe('presentation bootstrap template (INT-001)', () => {
  beforeAll(async () => {
    scratch = await mkdtemp(resolve(tmpdir(), 'and-scene-bootstrap-'))
    app = resolve(scratch, 'materialized-app')
    await cp(template, app, { recursive: true })
    const install = exec('npm', ['ci', '--ignore-scripts'], app)
    expect(install.status, install.output).toBe(0)
  }, 300_000)
  afterAll(async () => { if (scratch) await rm(scratch, { recursive: true, force: true }) })

  it('builds and renders the registered route when invoked outside the template directory', () => {
    const lint = exec('npm', ['--prefix', app, 'run', 'lint'], scratch)
    expect(lint.status, lint.output).toBe(0)
    const build = exec('npm', ['--prefix', app, 'run', 'build'], scratch)
    expect(build.status, build.output).toBe(0)
    const verify = exec('npm', ['--prefix', app, 'run', 'verify'], scratch)
    expect(verify.status, verify.output).toBe(0)
    expect(verify.output).toContain('PASS: build and registered example route render cleanly')
  }, 300_000)

  it('ships all three contract anchors and required dependencies', async () => {
    for (const path of ['vite.config.ts', 'src/presentation-kit/types.ts', 'src/presentations.ts', 'src/main.tsx']) {
      await expect(readFile(resolve(app, path), 'utf8')).resolves.toBeTruthy()
    }
    const packageJson = JSON.parse(await readFile(resolve(app, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(packageJson.dependencies).toHaveProperty(name)
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'typescript-eslint', 'playwright']) expect(packageJson.devDependencies).toHaveProperty(name)
    expect(packageJson.devDependencies).not.toHaveProperty('tailwindcss')
  })

  it('keeps kit source byte-aligned and free of visual defaults', async () => {
    const canonical = resolve(repo, 'src/presentation-kit')
    const canonicalFiles = (await files(canonical)).sort()
    const copiedFiles = (await files(resolve(app, 'src/presentation-kit'))).sort()
    expect(copiedFiles).toEqual(canonicalFiles)
    for (const path of canonicalFiles) {
      await expect(readFile(resolve(app, 'src/presentation-kit', path))).resolves.toEqual(await readFile(resolve(canonical, path)))
    }
    const kit = (await Promise.all(canonicalFiles.map(path => readFile(resolve(canonical, path), 'utf8')))).join('\n')
    expect(kit).not.toMatch(/tailwind|#[0-9a-f]{3,8}\b|font-family|box-shadow|--[\w-]+\s*:/i)
    expect(kit).not.toMatch(/(?:padding|margin)\s*:\s*\d/)
    const bootstrapCss = await readFile(resolve(app, 'src/style.css'), 'utf8')
    expect(bootstrapCss).not.toMatch(/#[0-9a-f]{3,8}|font-family|box-shadow|--[\w-]+\s*:/i)
    const skill = await readFile(resolve(repo, 'skills/presentation/SKILL.md'), 'utf8')
    expect(skill).toMatch(/template paths below are relative to that directory/)
  })
})
