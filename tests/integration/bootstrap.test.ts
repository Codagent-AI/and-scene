import { cp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, remove, run, tempDir, type RunResult } from '../helpers/workspace'

const TEMPLATE = path.join(REPO, 'skills/presentation/templates/bootstrap')

async function files(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? files(path.join(dir, e.name), base) : Promise.resolve([path.relative(base, path.join(dir, e.name))]))),
  )
  return nested.flat().sort()
}

const REQUIRED_DEPS = [
  'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom',
  '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
]

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  let dir: string
  let install: RunResult
  let build: RunResult
  let lint: RunResult
  let verify: RunResult

  beforeAll(async () => {
    dir = await tempDir('bootstrap')
    await cp(TEMPLATE, dir, { recursive: true })
    install = await run('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], dir)
    build = await run('npm', ['run', 'build'], dir)
    lint = await run('npm', ['run', 'lint'], dir)
    // invoke the local verification entry point from outside the materialized project
    verify = await run('node', [path.join(dir, 'scripts/verify.mjs')], tmpdir())
  })
  afterAll(() => remove(dir))

  it('installs from the committed lock data and builds', () => {
    expect(install.code, install.output).toBe(0)
    expect(build.code, build.output).toBe(0)
    expect(lint.code, lint.output).toBe(0)
  })

  it('renders its registered route through the local verification entry point, whatever the caller cwd', () => {
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toContain('PASS render starter (3 steps')
  })

  it('has all three scaffold anchors', async () => {
    const all = await files(dir).then((f) => f.filter((p) => !p.startsWith('node_modules') && !p.startsWith('dist')))
    for (const anchor of [
      'package.json', 'vite.config.ts', 'tsconfig.app.json', // build setup
      'src/presentation-kit/types.ts', 'src/presentation-kit/Stage.tsx', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/usePresentationNav.ts', // scene kit
      'src/presentations/index.ts', 'src/main.tsx', 'src/routing.ts', // presentation index
      'scripts/verify.mjs', 'scripts/inspect-presentation.mjs',
    ]) {
      expect(all, anchor).toContain(anchor)
    }
  })

  it('declares the complete dependency set in package.json and the lock file', async () => {
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    const lock = JSON.parse(await readFile(path.join(dir, 'package-lock.json'), 'utf8'))
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    const locked = { ...lock.packages[''].dependencies, ...lock.packages[''].devDependencies }
    for (const dep of REQUIRED_DEPS) {
      expect(declared, dep).toHaveProperty(dep)
      expect(locked, dep).toHaveProperty(dep)
    }
    expect(pkg.scripts).toMatchObject({ build: 'tsc -b && vite build', lint: 'eslint .' })
    expect(pkg.scripts.verify).toContain('scripts/verify.mjs')
  })

  it('keeps the kit and root scripts byte-aligned with the canonical sources', async () => {
    for (const [canonical, template] of [
      [path.join(REPO, 'src/presentation-kit'), path.join(TEMPLATE, 'src/presentation-kit')],
      [path.join(REPO, 'scripts/lib'), path.join(TEMPLATE, 'scripts/lib')],
    ]) {
      const names = await files(canonical)
      expect(await files(template)).toEqual(names)
      for (const name of names) {
        expect(await readFile(path.join(template, name), 'utf8'), name).toBe(await readFile(path.join(canonical, name), 'utf8'))
      }
    }
    for (const script of ['verify.mjs', 'inspect-presentation.mjs']) {
      expect(await readFile(path.join(TEMPLATE, 'scripts', script), 'utf8'), script).toBe(await readFile(path.join(REPO, 'scripts', script), 'utf8'))
    }
  })

  it('introduces no Tailwind and no visual defaults', async () => {
    const all = (await files(dir)).filter((p) => !p.startsWith('node_modules') && !p.startsWith('dist') && p !== 'package-lock.json')
    const lockText = await readFile(path.join(dir, 'package-lock.json'), 'utf8')
    expect(lockText).not.toMatch(/tailwind/i)
    const visual = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|font-family|box-shadow|border-radius/i
    const spacing = /\bgap\s*:|\bpadding\w*\s*:|\bmargin\w*\s*:|list-style|flexWrap|alignItems/i
    for (const file of all) {
      const text = await readFile(path.join(dir, file), 'utf8')
      expect(text, file).not.toMatch(/tailwind/i)
      if (/\.css$/.test(file) || file.startsWith('src/presentation-kit/')) {
        expect(text.replace(/\/\*[\s\S]*?\*\//g, ''), file).not.toMatch(visual)
      }
      if (file.startsWith('src/presentation-kit/')) {
        expect(text.replace(/\/\*[\s\S]*?\*\//g, ''), file).not.toMatch(spacing)
      }
    }
    expect(all.filter((p) => p.startsWith('src/presentation-kit/') && p.endsWith('.css'))).toEqual([])
  })
})
