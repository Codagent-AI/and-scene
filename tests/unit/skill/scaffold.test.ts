// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

// Target resolution, partial scaffolding, and presentation registration for the skill's
// deterministic helper. Runs the CLI in disposable directories with --no-install, so no network.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const skillRoot = join(repoRoot, 'skills', 'presentation')
const helper = join(skillRoot, 'scripts', 'scaffold.mjs')
const bootstrap = join(skillRoot, 'templates', 'bootstrap')

const disposables: string[] = []
afterAll(() => {
  for (const dir of disposables) rmSync(dir, { recursive: true, force: true })
})

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  disposables.push(dir)
  return dir
}

interface CliResult {
  status: number | null
  json: Record<string, unknown> | null
  stderr: string
}

/** Runs the helper from `cwd`, which deliberately differs from the project under test. */
function run(args: string[], cwd = tempDir('and-scene-cwd-')): CliResult {
  const result = spawnSync(process.execPath, [helper, ...args], { cwd, encoding: 'utf8', timeout: 120_000 })
  return { status: result.status, json: parseJson(result.stdout), stderr: result.stderr }
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function writeProjectFile(root: string, rel: string, text: string): void {
  mkdirSync(join(root, rel, '..'), { recursive: true })
  writeFileSync(join(root, rel), text)
}

/** A Vite build setup alone: the build anchor without the kit or registry. */
function seedBuildSetup(root: string): void {
  writeProjectFile(
    root,
    'package.json',
    JSON.stringify({ name: 'host', private: true, scripts: { build: 'vite build' }, devDependencies: { vite: '^8.0.0' } }),
  )
  writeProjectFile(root, 'vite.config.ts', 'export default {}\n')
}

describe('plan and target resolution', () => {
  it('scaffolds an empty directory at the root with all three anchors', () => {
    const root = tempDir('and-scene-empty-')
    const result = run(['scaffold', root, '--no-install'])
    expect(result.status, result.stderr).toBe(0)
    expect(result.json).toMatchObject({ action: 'scaffolded', target: '.', requiresConfirmation: false })
    expect(result.json?.anchors).toEqual({ build: true, kit: true, index: true })
    expect(existsSync(join(root, 'src', 'presentation-kit', 'Presentation.tsx'))).toBe(true)
    expect(existsSync(join(root, 'src', 'presentations', 'index.ts'))).toBe(true)
  })

  it('ensures the full dependency set and adds no styling framework', () => {
    const root = tempDir('and-scene-deps-')
    run(['scaffold', root, '--no-install'])
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeDefined()
    for (const name of [
      'vite',
      '@vitejs/plugin-react',
      'typescript',
      '@types/react',
      '@types/react-dom',
      '@types/node',
      'eslint',
      'playwright',
    ]) {
      expect(pkg.devDependencies[name], name).toBeDefined()
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(all).filter((name) => /tailwind|daisy|bootstrap|mui|chakra/.test(name))).toEqual([])
  })

  it('resolves a monorepo to a self-contained presentations/ app and leaves the root untouched', () => {
    const root = tempDir('and-scene-mono-')
    writeProjectFile(root, 'package.json', JSON.stringify({ name: 'mono', private: true, workspaces: ['packages/*'] }))
    writeProjectFile(root, 'packages/lib/package.json', '{"name":"lib"}')
    writeProjectFile(root, 'README.md', '# unrelated content\n')
    const rootBefore = readFileSync(join(root, 'package.json'), 'utf8')

    const plan = run(['plan', root])
    expect(plan.json).toMatchObject({ target: 'presentations', monorepo: { isMonorepo: true } })

    const result = run(['scaffold', root, '--confirm', '--no-install'])
    expect(result.status, result.stderr).toBe(0)
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(rootBefore)
    expect(existsSync(join(root, 'src'))).toBe(false)
    expect(existsSync(join(root, 'presentations', 'src', 'presentation-kit', 'Presentation.tsx'))).toBe(true)
    expect(existsSync(join(root, 'presentations', 'vite.config.ts'))).toBe(true)
    expect(readFileSync(join(root, 'README.md'), 'utf8')).toBe('# unrelated content\n')
  })

  it('refuses to write into a non-empty project until the target is confirmed', () => {
    const root = tempDir('and-scene-nonempty-')
    writeProjectFile(root, 'notes.txt', 'existing work\n')
    const result = run(['scaffold', root, '--no-install'])
    expect(result.status).toBe(2)
    expect(result.json).toMatchObject({ action: 'refused', requiresConfirmation: true })
    expect(existsSync(join(root, 'package.json'))).toBe(false)

    const confirmed = run(['scaffold', root, '--confirm', '--no-install'])
    expect(confirmed.status).toBe(0)
    expect(readFileSync(join(root, 'notes.txt'), 'utf8')).toBe('existing work\n')
  })

  it('adds only missing anchors and never overwrites existing files', () => {
    const root = tempDir('and-scene-partial-')
    seedBuildSetup(root)
    const kitSource = join(bootstrap, 'src', 'presentation-kit')
    mkdirSync(join(root, 'src'), { recursive: true })
    cpSync(kitSource, join(root, 'src', 'presentation-kit'), { recursive: true })
    writeProjectFile(root, 'src/presentation-kit/hooks.ts', '// host customization\n')
    writeProjectFile(root, 'vite.config.ts', 'export default { host: true }\n')

    const result = run(['scaffold', root, '--confirm', '--no-install'])
    expect(result.status, result.stderr).toBe(0)
    expect(result.json?.anchorsBefore).toEqual({ build: true, kit: true, index: false })
    expect(readFileSync(join(root, 'src/presentation-kit/hooks.ts'), 'utf8')).toBe('// host customization\n')
    expect(readFileSync(join(root, 'vite.config.ts'), 'utf8')).toBe('export default { host: true }\n')
    expect(existsSync(join(root, 'src', 'presentations', 'index.ts'))).toBe(true)
    expect(existsSync(join(root, 'src', 'main.tsx'))).toBe(true)
  })

  it('reports nothing to do when every anchor is present', () => {
    const root = tempDir('and-scene-complete-')
    run(['scaffold', root, '--no-install'])
    const again = run(['scaffold', root, '--no-install'])
    expect(again.status).toBe(0)
    expect(again.json).toMatchObject({ action: 'none' })
  })
})

describe('add a presentation', () => {
  it('materializes the presentation template and registers it above the marker', () => {
    const root = tempDir('and-scene-add-')
    run(['scaffold', root, '--no-install'])
    const result = run(['add', root, '--slug', 'my-talk', '--title', "You're here"])
    expect(result.status, result.stderr).toBe(0)

    const talk = readFileSync(join(root, 'src/presentations/my-talk/Talk.tsx'), 'utf8')
    expect(talk).toContain("const TITLE = 'You\\'re here'")
    expect(talk).toContain('className="my-talk"')
    expect(talk).not.toMatch(/\{\{[A-Z_]+\}\}/)

    const registry = readFileSync(join(root, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'my-talk',")
    expect(registry).toContain("load: () => import('./my-talk/Talk'),")
    expect(registry.indexOf("slug: 'my-talk'")).toBeLessThan(registry.indexOf('// @presentation-registry'))
  })

  it('writes titles containing replacement patterns literally into the registry', () => {
    const root = tempDir('and-scene-dollar-')
    run(['scaffold', root, '--no-install'])
    const title = 'Costs $& and $\' and $$ more'
    const result = run(['add', root, '--slug', 'costs', '--title', title])
    expect(result.status, result.stderr).toBe(0)
    const registry = readFileSync(join(root, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain(`title: '${title.replace(/'/g, "\\'")}',`)
    expect(registry).toContain('// @presentation-registry')
    expect(registry.match(/export const PRESENTATIONS/g)).toHaveLength(1)
  })

  it('keeps existing presentations registered when adding another', () => {
    const root = tempDir('and-scene-two-')
    run(['scaffold', root, '--no-install'])
    run(['add', root, '--slug', 'first-talk', '--title', 'First'])
    const second = run(['add', root, '--slug', 'second-talk', '--title', 'Second'])
    expect(second.status, second.stderr).toBe(0)
    const registry = readFileSync(join(root, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'first-talk',")
    expect(registry).toContain("slug: 'second-talk',")
  })

  it('rejects invalid slugs, duplicate slugs, and empty titles', () => {
    const root = tempDir('and-scene-reject-')
    run(['scaffold', root, '--no-install'])
    expect(run(['add', root, '--slug', 'Bad Slug', '--title', 'x']).status).toBe(1)
    // A leading digit makes `.<slug>` an invalid CSS class selector, which would silently unstyle the deck.
    expect(run(['add', root, '--slug', '2024-recap', '--title', 'x']).status).toBe(1)
    expect(run(['add', root, '--slug', 'ok-slug', '--title', '   ']).status).toBe(1)
    expect(run(['add', root, '--slug', 'ok-slug', '--title', 'Fine']).status).toBe(0)
    const duplicate = run(['add', root, '--slug', 'ok-slug', '--title', 'Again'])
    expect(duplicate.status).toBe(1)
    expect(duplicate.stderr).toMatch(/already/)
  })
})
