import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = join(repo, 'skills/presentation/templates/bootstrap')
const kit = join(repo, 'src/presentation-kit')
const parityFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? parityFiles(join(directory, entry.name)).then((children) => children.map((child) => `${entry.name}/${child}`))
    : [entry.name]))).flat()
}

describe('presentation bootstrap snapshot (INT-001)', () => {
  it('materializes, installs, builds and browser-checks outside the source checkout', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    const app = join(temp, 'app')
    const caller = join(temp, 'outside-caller')
    try {
      await cp(bootstrap, app, { recursive: true })
      await import('node:fs/promises').then(({ mkdir }) => mkdir(caller))
      const pkg = JSON.parse(await readFile(join(app, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string>; scripts: Record<string, string> }
      for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[dependency]).toBeTruthy()
      for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@playwright/test']) expect(pkg.devDependencies[dependency]).toBeTruthy()
      expect(pkg.scripts.build).toBeTruthy()
      expect(pkg.scripts.verify).toBeTruthy()
      expect(pkg.scripts.inspect).toBeTruthy()
      expect(pkg.devDependencies).not.toHaveProperty('tailwindcss')
      expect(pkg.devDependencies).not.toHaveProperty('@tailwindcss/vite')

      const canonical = (await parityFiles(kit)).filter((file) => !file.endsWith('.test.tsx')).sort()
      const snapshot = (await parityFiles(join(app, 'src/presentation-kit'))).filter((file) => !file.endsWith('.test.tsx')).sort()
      expect(snapshot).toEqual(canonical)
      for (const file of canonical) expect(await readFile(join(app, 'src/presentation-kit', file))).toEqual(await readFile(join(kit, file)))

      const css = await readFile(join(app, 'src/index.css'), 'utf8')
      expect(css).not.toMatch(/#[0-9a-f]{3,8}|\b(font-family|box-shadow|border|background-color)\s*:/i)
      expect(await readFile(join(app, 'package-lock.json'), 'utf8')).toContain('"lockfileVersion"')
      expect(await readFile(join(app, 'src/presentations/index.ts'), 'utf8')).toContain('presentations')
      expect(await readFile(join(app, 'src/presentation-kit/types.ts'), 'utf8')).toContain('export type Step')

      await exec('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app, timeout: 180_000, maxBuffer: 4 * 1024 * 1024 })
      await exec('npm', ['run', 'build'], { cwd: app, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 })
      await exec('npm', ['run', 'lint'], { cwd: app, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 })
      // Invoke the project-local helper by absolute path from a different cwd.
      await exec('node', [join(app, 'scripts/verify.mjs')], { cwd: caller, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 })
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 480_000)
})
