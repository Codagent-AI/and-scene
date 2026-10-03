import { mkdtemp, readFile, readdir, rm, cp, stat, mkdir, writeFile } from 'node:fs/promises'
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
  it('keeps the scaffolded verification script aligned with the repository copy', async () => {
    expect(await readFile(join(root, 'scripts/verify.mjs'))).toEqual(await readFile(join(bootstrap, 'scripts/verify.mjs')))
  })

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
      const registryPath = join(app, 'src/presentations/index.ts')
      const registry = (await readFile(registryPath, 'utf8')).replace("slug: 'starter'", "slug: 'custom-route'").replace("  { slug: 'custom-route', title: 'Starter presentation', load: () => import('./starter/Talk') },", "  { slug: 'custom-route', title: 'Starter presentation', load: () => import('./starter/Talk') },\n  {\n    slug: 'secondary-route',\n    title: 'Secondary presentation',\n    load: async () => { return import('./starter/Talk') },\n  },")
      await writeFile(registryPath, registry)

      await exec('npm', ['ci', '--ignore-scripts'], { cwd: app, timeout: 180_000 })
      await exec('npm', ['run', 'build'], { cwd: app, timeout: 120_000 })
      await exec('npm', ['run', 'lint'], { cwd: app, timeout: 120_000 })
      await exec('npm', ['run', 'inspect', '--', 'custom-route'], { cwd: app, timeout: 120_000 })
      expect((await readdir(join(app, 'artifacts/presentation-inspection/custom-route'))).filter((name) => name.endsWith('.png'))).toHaveLength(1)
      await expect(exec('npm', ['run', 'inspect', '--', 'unknown-route'], { cwd: app, timeout: 30_000 })).rejects.toMatchObject({ stderr: expect.stringContaining('No presentation found at /unknown-route') })
      await writeFile(registryPath, `${registry}\n// { slug: 'comment-only', title: 'Fake route', load: () => import('./missing/Talk') }\n`)
      await expect(exec('npm', ['run', 'inspect', '--', 'comment-only'], { cwd: app, timeout: 30_000 })).rejects.toMatchObject({ stderr: expect.stringContaining('No presentation found at /comment-only') })
      // Invoke by absolute script path from outside the app to prove cwd independence.
      const verification = await exec('node', [join(app, 'scripts/verify.mjs')], { cwd: caller, timeout: 120_000 })
      expect(verification.stdout).toContain('PASS: /custom-route renders every registered starter step in Chromium')
      const secondaryVerification = await exec('node', [join(app, 'scripts/verify.mjs'), 'secondary-route'], { cwd: caller, timeout: 120_000 })
      expect(secondaryVerification.stdout).toContain('PASS: /secondary-route renders every registered starter step in Chromium')
      await expect(exec('node', [join(app, 'scripts/verify.mjs'), 'comment-only'], { cwd: caller, timeout: 30_000 })).rejects.toMatchObject({ stderr: expect.stringContaining('FAIL: sample: unknown presentation slug "comment-only"') })

      await writeFile(join(app, 'src/presentations/starter/Talk.tsx'), `import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'
function Scene() { return <div className="fixture-scene">
  <span className="fixture-overlap-a">UNMARKED-A</span><span className="fixture-overlap-b">UNMARKED-B</span>
  <div data-presentation-allow-overlap=""><span className="fixture-allowed-a">ALLOWED-A</span><span className="fixture-allowed-b">ALLOWED-B</span></div>
</div> }
const steps: Step<undefined>[] = [
  { id: 'one', era: 'Start', title: 'Fixture first', caption: 'Inspect diagnostics.', Scene, payload: undefined },
  { id: 'two', era: 'Finish', title: 'Fixture last', caption: 'Inspect the settled second state.', Scene, payload: undefined },
]
export default function Talk() { return <Presentation steps={steps} title="Inspection fixture" initialMode="browse" /> }
`)
      await writeFile(join(app, 'src/index.css'), `* { box-sizing: border-box; } html, body, #root { width: 100%; min-height: 100%; margin: 0; } body { min-width: 320px; }
.fixture-scene { position: absolute; inset: 0; }
.fixture-overlap-a, .fixture-overlap-b, .fixture-allowed-a, .fixture-allowed-b { position: absolute; left: 24px; top: 24px; }
.fixture-overlap-a, .fixture-allowed-a { width: 90px; height: 32px; background: #eee; }
.fixture-overlap-b, .fixture-allowed-b { width: 90px; height: 32px; background: #ccc; }
.presentation-progress button { color: #111 !important; background: #fff !important; border-color: #777 !important; font-weight: 400 !important; outline: none !important; }
[data-presentation-attribution] { color: #00e !important; font-size: 8px !important; }
`)
      await exec('npm', ['run', 'build'], { cwd: app, timeout: 120_000 })
      const inspection = await exec('npm', ['run', 'inspect', '--', 'custom-route'], { cwd: app, timeout: 120_000 })
      expect((await readdir(join(app, 'artifacts/presentation-inspection/custom-route'))).filter((name) => name.endsWith('.png'))).toHaveLength(2)
      expect(inspection.stderr).toContain('step 1: unmarked visible text/chrome overlap: "UNMARKED-A" / "UNMARKED-B"')
      expect(inspection.stderr).toContain('active progress state may be visually indistinguishable')
      expect(inspection.stderr).toContain('attribution may be browser-default or undersized')
      expect(inspection.stderr).not.toContain('ALLOWED-A')
      expect(inspection.stderr).not.toContain('ALLOWED-B')
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 360_000)
})
