import { mkdtemp, readFile, readdir, rm, cp, stat, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const kit = join(root, 'src/presentation-kit')
const bootstrap = join(root, 'skills/presentation/templates/bootstrap')

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory()
    ? files(join(dir, entry.name)).then((names) => names.map((name) => join(entry.name, name)))
    : [entry.name]))).flat().sort()
}

describe('distributable bootstrap template', () => {
  it('materializes outside the source tree, preserves kit parity, and builds/renders without a styling framework', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    const app = join(temp, 'app')
    const caller = join(temp, 'caller')
    await cp(bootstrap, app, { recursive: true })
    await mkdir(caller)
    try {
      const sourceFiles = await files(kit)
      const templateFiles = await files(join(app, 'src/presentation-kit'))
      expect(templateFiles).toEqual(sourceFiles)
      for (const name of sourceFiles) {
        expect(await readFile(join(app, 'src/presentation-kit', name))).toEqual(await readFile(join(kit, name)))
      }

      const manifest = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
      const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
      for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'globals', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) expect(dependencies[dependency]).toBeTruthy()
      expect(Object.keys(dependencies)).not.toContain('tailwindcss')
      expect(await readFile(join(app, 'src/index.css'), 'utf8')).not.toMatch(/#[0-9a-f]{3,8}\b|font-family|--[\w-]+\s*:/i)
      expect(await stat(join(app, 'src/presentation-kit/Presentation.tsx'))).toBeTruthy()
      expect(await stat(join(app, 'src/presentations/index.ts'))).toBeTruthy()
      expect(await stat(join(app, 'vite.config.ts'))).toBeTruthy()

      await exec('npm', ['ci', '--ignore-scripts'], { cwd: app, timeout: 180_000 })
      await exec('npm', ['run', 'build'], { cwd: app, timeout: 120_000 })
      await exec('npm', ['run', 'lint'], { cwd: app, timeout: 120_000 })
      await exec('npm', ['run', 'inspect', '--', 'starter'], { cwd: app, timeout: 120_000 })
      expect((await readdir(join(app, 'artifacts/presentation-inspection/starter'))).filter((name) => name.endsWith('.png'))).toHaveLength(1)
      // Invoke by absolute script path from outside the app to prove cwd independence.
      await exec('node', [join(app, 'scripts/verify.mjs')], { cwd: caller, timeout: 120_000 })
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 360_000)
})
