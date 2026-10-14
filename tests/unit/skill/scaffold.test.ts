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

describe('routing of a kept host entry point', () => {
  const HOST_MAIN = "import { createRoot } from 'react-dom/client'\ncreateRoot(document.getElementById('root')!).render('Host application')\n"

  function seedHostEntry(root: string, main: string): void {
    seedBuildSetup(root)
    writeProjectFile(root, 'src/main.tsx', main)
  }

  it('reports a scaffolded app as routed', () => {
    const root = tempDir('and-scene-routed-')
    const scaffolded = run(['scaffold', root, '--no-install'])
    expect(scaffolded.json?.routing).toMatchObject({ routed: true, entry: 'src/main.tsx' })
    const added = run(['add', root, '--slug', 'my-talk', '--title', 'Talk'])
    expect(added.json?.routing).toMatchObject({ routed: true })
  })

  it('flags a kept host entry point that never reaches the router or registry', () => {
    const root = tempDir('and-scene-unrouted-')
    seedHostEntry(root, HOST_MAIN)
    const scaffolded = run(['scaffold', root, '--confirm', '--no-install'])
    expect(scaffolded.status, scaffolded.stderr).toBe(0)
    expect(readFileSync(join(root, 'src/main.tsx'), 'utf8')).toBe(HOST_MAIN)
    expect(scaffolded.json?.routing).toMatchObject({ routed: false, entry: 'src/main.tsx' })

    const added = run(['add', root, '--slug', 'my-talk', '--title', 'Talk'])
    expect(added.status, added.stderr).toBe(0)
    expect(added.json?.routing).toMatchObject({ routed: false, entry: 'src/main.tsx' })
    expect(String((added.json?.routing as { message: string }).message)).toContain('RouteView')
  })

  it('treats an entry point that reaches the router through the host app as routed', () => {
    const root = tempDir('and-scene-indirect-')
    seedHostEntry(root, "import { App } from './App'\nvoid App\n")
    writeProjectFile(root, 'src/App.tsx', "import { RouteView } from './RouteView'\nexport const App = RouteView\n")
    const scaffolded = run(['scaffold', root, '--confirm', '--no-install'])
    expect(scaffolded.json?.routing).toMatchObject({ routed: true })
  })

  it('resolves TypeScript-style .js import specifiers to their .ts or .tsx sources', () => {
    const root = tempDir('and-scene-js-ext-')
    seedHostEntry(root, "import { App } from './App.js'\nvoid App\n")
    writeProjectFile(root, 'src/App.tsx', "import { RouteView } from './RouteView.js'\nexport const App = RouteView\n")
    const scaffolded = run(['scaffold', root, '--confirm', '--no-install'])
    expect(scaffolded.json?.routing).toMatchObject({ routed: true })
  })

  it('reports unknown rather than unrouted when the entry imports through an alias', () => {
    const root = tempDir('and-scene-alias-')
    seedHostEntry(root, "import { App } from '@/App'\nvoid App\n")
    writeProjectFile(root, 'src/App.tsx', "export const App = 'host'\n")
    const scaffolded = run(['scaffold', root, '--confirm', '--no-install'])
    const routing = scaffolded.json?.routing as { routed: unknown; message: string }
    expect(routing.routed).toBeNull()
    expect(routing.message).toContain('could not be traced')
  })

  it('reads the module script from index.html regardless of attribute order, comments, and ./ prefixes', () => {
    const root = tempDir('and-scene-html-attrs-')
    seedHostEntry(root, "import './RouteView'\n")
    writeProjectFile(
      root,
      'index.html',
      '<div id="root"></div>\n<!-- <script type="module" src="/src/main.tsx"></script> -->\n<script src="./src/host.tsx" type="module"></script>\n',
    )
    writeProjectFile(root, 'src/host.tsx', HOST_MAIN)
    const scaffolded = run(['scaffold', root, '--confirm', '--no-install'])
    expect(scaffolded.json?.routing).toMatchObject({ routed: false, entry: 'src/host.tsx' })
  })

  it('flags an entry point that only imports the router for its side effects or never uses the binding', () => {
    const sideEffect = tempDir('and-scene-side-effect-')
    seedHostEntry(sideEffect, `import './RouteView'\n${HOST_MAIN}`)
    expect(run(['scaffold', sideEffect, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: false })

    const unused = tempDir('and-scene-unused-binding-')
    seedHostEntry(unused, `import { RouteView } from './RouteView'\n${HOST_MAIN}`)
    expect(run(['scaffold', unused, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: false })

    const hop = tempDir('and-scene-unused-hop-')
    seedHostEntry(hop, `import { App } from './App'\n${HOST_MAIN}`)
    writeProjectFile(hop, 'src/App.tsx', "import { RouteView } from './RouteView'\nexport const App = RouteView\n")
    expect(run(['scaffold', hop, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: false })
  })

  it('counts aliased, namespace, dynamic, and re-exported router imports that are used', () => {
    const aliased = tempDir('and-scene-aliased-name-')
    seedHostEntry(aliased, "import { RouteView as Router } from './RouteView'\nconsole.log(<Router pathname=\"/\" />)\n")
    expect(run(['scaffold', aliased, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: true })

    const namespaced = tempDir('and-scene-namespace-')
    seedHostEntry(namespaced, "import * as views from './RouteView'\nconsole.log(views.RouteView)\n")
    expect(run(['scaffold', namespaced, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: true })

    const dynamic = tempDir('and-scene-dynamic-')
    seedHostEntry(dynamic, "const view = () => import('./RouteView')\nvoid view\n")
    expect(run(['scaffold', dynamic, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: true })

    const barrel = tempDir('and-scene-barrel-')
    seedHostEntry(barrel, "import { RouteView } from './views'\nconsole.log(RouteView)\n")
    writeProjectFile(barrel, 'src/views.ts', "export { RouteView } from './RouteView'\n")
    expect(run(['scaffold', barrel, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: true })
  })

  it('does not let an export statement or a comment stand in for a used import', () => {
    const exportAbove = tempDir('and-scene-export-span-')
    seedHostEntry(exportAbove, "export const label = 'host'\nimport { RouteView } from './RouteView'\nconsole.log(label)\n")
    expect(run(['scaffold', exportAbove, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: false })

    const commented = tempDir('and-scene-commented-')
    seedHostEntry(
      commented,
      "// import { RouteView } from './RouteView'\n/* const lazy = () => import('./RouteView') */\nconsole.log('host')\n",
    )
    expect(run(['scaffold', commented, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: false })

    const usedAfterExport = tempDir('and-scene-export-usage-')
    seedHostEntry(
      usedAfterExport,
      "import { RouteView } from './RouteView'\nexport const App = () => RouteView\nconsole.log(App)\n",
    )
    expect(run(['scaffold', usedAfterExport, '--confirm', '--no-install']).json?.routing).toMatchObject({ routed: true })
  })

  it('follows the entry point named by index.html', () => {
    const root = tempDir('and-scene-html-entry-')
    seedHostEntry(root, "import './RouteView'\n")
    writeProjectFile(root, 'index.html', '<div id="root"></div><script type="module" src="/src/host.tsx"></script>\n')
    writeProjectFile(root, 'src/host.tsx', HOST_MAIN)
    const scaffolded = run(['scaffold', root, '--confirm', '--no-install'])
    expect(scaffolded.json?.routing).toMatchObject({ routed: false, entry: 'src/host.tsx' })
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
