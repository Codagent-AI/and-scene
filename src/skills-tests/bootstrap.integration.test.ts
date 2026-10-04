import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const template = path.join(repository, 'skills/presentation/templates/bootstrap')
const tempParent = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
const app = path.join(tempParent, 'materialized-app')

async function filesBelow(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => filesBelow(path.join(directory, entry.name), path.posix.join(prefix, entry.name))))
  return [...entries.filter((entry) => entry.isFile()).map((entry) => path.posix.join(prefix, entry.name)), ...nested.flat()]
}

function run(command: string, args: string[], cwd: string) {
  execFileSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, CI: '1' } })
}

beforeAll(async () => {
  await cp(template, app, { recursive: true })
}, 30_000)
afterAll(async () => { await rm(tempParent, { recursive: true, force: true }) })

describe('materialized presentation bootstrap (INT-001)', () => {
  it('includes the three anchors and complete dependency contract without a styling framework', async () => {
    const manifest = JSON.parse(await readFile(path.join(app, 'package.json'), 'utf8')) as { scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> }
    expect(manifest.scripts.build).toBeTruthy()
    expect(manifest.scripts.verify).toBeTruthy()
    expect(await readFile(path.join(app, 'src/presentation-kit/types.ts'), 'utf8')).toContain('export interface Step')
    expect(await readFile(path.join(app, 'src/presentations/index.ts'), 'utf8')).toContain('export const presentations')
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) expect(manifest.dependencies[dependency]).toBeTruthy()
    for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) expect(manifest.devDependencies[dependency]).toBeTruthy()
    expect(JSON.stringify(manifest)).not.toMatch(/tailwind/i)
  })

  it('keeps every production kit file byte-aligned and style-neutral', async () => {
    const canonical = path.join(repository, 'src/presentation-kit')
    const expected = (await filesBelow(canonical)).filter((name) => !name.endsWith('.test.tsx')).sort()
    const actual = (await filesBelow(path.join(app, 'src/presentation-kit'))).sort()
    expect(actual).toEqual(expected)
    for (const relative of expected) {
      const [left, right] = await Promise.all([readFile(path.join(canonical, relative)), readFile(path.join(app, 'src/presentation-kit', relative))])
      expect(right.equals(left), `${relative} differs from canonical kit`).toBe(true)
    }
    const nodeSources = await Promise.all(expected.filter((name) => name.startsWith('nodes/')).map((name) => readFile(path.join(app, 'src/presentation-kit', name), 'utf8')))
    expect(nodeSources.join('\n')).not.toMatch(/(?:#[\da-f]{3,8}|\b(?:color|background|border|boxShadow|fontFamily|fontSize)\s*:)/i)
  })

  it('builds and renders its registered starter route from outside the source repository', async () => {
    run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], app)
    run('npm', ['run', 'lint'], app)
    run('npm', ['run', 'build'], app)
    run('npx', ['playwright', 'install', 'chromium'], app)
    run('npm', ['run', 'verify'], app)
    run('npm', ['run', 'inspect', '--', 'starter'], app)
    expect((await readdir(path.join(app, 'inspection'))).filter((name) => name.endsWith('.png'))).toEqual(['starter-01.png'])
  }, 300_000)
})
