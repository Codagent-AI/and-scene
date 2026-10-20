import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, inject, it } from 'vitest'
import { ROOT, listFiles, nonTestFiles, read } from '../helpers/repo.ts'
import { run, previewProcesses, type RunResult } from '../helpers/process.ts'

// INT-001: the distributable bootstrap snapshot works outside the repository that authored it.
const dir = inject('templateDir')
const REQUIRED = [
  'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
  '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh', 'globals', 'playwright',
]

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  let build: RunResult
  let verify: RunResult

  beforeAll(async () => {
    build = await run('npm', ['run', 'build'], dir)
    // Invoked from an unrelated working directory: nothing may depend on the caller's cwd.
    verify = await run(process.execPath, [join(dir, 'scripts/verify.mjs')], tmpdir())
  })

  it('materializes outside the source repository with a real, installed node_modules', () => {
    expect(dir.startsWith(ROOT)).toBe(false)
    const modules = join(dir, 'node_modules')
    for (const entry of readdirSync(modules).filter((e) => !e.startsWith('.'))) {
      expect(lstatSync(join(modules, entry)).isSymbolicLink(), entry).toBe(false)
    }
  })

  it('installs every required dependency from the committed lock data', () => {
    for (const name of REQUIRED) expect(existsSync(join(dir, 'node_modules', name, 'package.json')), name).toBe(true)
  })

  it('has all three contract anchors', () => {
    expect(existsSync(join(dir, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(dir, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(read(join(dir, 'src/presentations/index.ts'))).toContain("slug: 'example'")
  })

  it('builds', () => {
    expect(build.code, build.stdout + build.stderr).toBe(0)
    expect(existsSync(join(dir, 'dist/index.html'))).toBe(true)
  })

  it('passes the route smoke check through its own verify entry point, from another cwd, on 127.0.0.1', () => {
    expect(verify.code, verify.stdout + verify.stderr).toBe(0)
    expect(verify.stdout).toContain('PASS verify')
    expect(verify.stdout).toMatch(/verify: opening http:\/\/127\.0\.0\.1:\d+\/example/)
    expect(verify.stdout).toContain('(3 steps)')
    expect(verify.stdout).not.toContain('localhost')
  })

  it('leaves no preview process behind', async () => {
    expect(await previewProcesses(dir)).toEqual([])
  })

  it('imports nothing from the source tree', () => {
    for (const file of listFiles(join(dir, 'src')).filter((f) => /\.tsx?$/.test(f))) {
      const imports = [...read(file).matchAll(/from ['"](\.[^'"]+)['"]/g)].map((m) => m[1])
      for (const spec of imports) expect(existsSync(join(file, '..', spec)), `${file} -> ${spec}`).toBe(true)
    }
    expect(read(join(dir, 'package.json'))).not.toContain(ROOT)
  })

  it('keeps the materialized kit aligned with the canonical kit', () => {
    const kit = 'src/presentation-kit'
    expect(nonTestFiles(join(dir, kit))).toEqual(nonTestFiles(join(ROOT, kit)))
    for (const file of nonTestFiles(join(ROOT, kit))) {
      expect(readFileSync(join(dir, kit, file)).equals(readFileSync(join(ROOT, kit, file))), file).toBe(true)
    }
  })

  it('introduces no Tailwind and no kit-owned visual defaults', () => {
    const pkg = JSON.parse(read(join(dir, 'package.json')))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => /tailwind/i.test(n))).toEqual([])
    expect(existsSync(join(dir, 'node_modules/tailwindcss'))).toBe(false)
    const built = listFiles(join(dir, 'dist')).filter((f) => /\.(css|js)$/.test(f)).map(read).join('\n')
    expect(built).not.toMatch(/tailwind/i)
    const css = listFiles(join(dir, 'dist')).filter((f) => f.endsWith('.css')).map(read).join('\n')
    expect(css).not.toMatch(/color|font|background|border|shadow|padding|margin/)
  })

  it('lints clean with its own configuration', async () => {
    const lint = await run('npm', ['run', 'lint'], dir)
    expect(lint.code, lint.stdout + lint.stderr).toBe(0)
  })
})
