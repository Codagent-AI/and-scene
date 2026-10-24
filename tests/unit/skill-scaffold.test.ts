// @vitest-environment node
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createPresentation,
  detect,
  registerInSource,
  scaffold,
} from '../../skills/presentation/scripts/lib.mjs'

const SCRIPTS = path.resolve(import.meta.dirname, '../../skills/presentation/scripts')
const dirs: string[] = []
function tmp(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-skill-'))
  dirs.push(d)
  return d
}
afterEach(() => dirs.splice(0).forEach((d) => fs.rmSync(d, { recursive: true, force: true })))

function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

/** Hash of every file under a directory, for before/after preservation checks. */
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else out[path.relative(dir, p)] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex')
    }
  }
  if (fs.existsSync(dir)) walk(dir)
  return out
}

/** A Vite + React + TypeScript project with only the build anchor. */
function writeBuildAnchor(dir: string, extra: object = {}) {
  write(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'host',
      scripts: { build: 'tsc -b && vite build' },
      dependencies: { react: '^19.0.0' },
      devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' },
      ...extra,
    }),
  )
  write(path.join(dir, 'vite.config.js'), 'export default {}\n')
  write(path.join(dir, 'index.html'), '<div id="root"></div>\n')
}

describe('detect', () => {
  it('treats an empty directory as a standalone root target needing no confirmation', () => {
    const plan = detect(tmp())
    expect(plan.empty).toBe(true)
    expect(plan.target).toBe('root')
    expect(plan.anchors).toEqual({ build: false, kit: false, index: false })
    expect(plan.needsConfirmation).toBe(false)
  })

  it('targets presentations/ for a monorepo, by each workspace signal', () => {
    const signals: [string, (d: string) => void][] = [
      ['workspaces', (d) => write(path.join(d, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }))],
      ['pnpm', (d) => write(path.join(d, 'pnpm-workspace.yaml'), 'packages:\n  - "x"\n')],
      ['packages', (d) => fs.mkdirSync(path.join(d, 'packages'))],
      ['apps', (d) => fs.mkdirSync(path.join(d, 'apps'))],
    ]
    for (const [name, setup] of signals) {
      const d = tmp()
      setup(d)
      const plan = detect(d)
      expect(plan.monorepo, name).toBe(true)
      expect(plan.target, name).toBe('presentations')
      expect(plan.appDir, name).toBe(path.join(d, 'presentations'))
      expect(plan.needsConfirmation, name).toBe(true)
    }
  })

  it('scaffolds a standalone non-empty project at its root, after confirmation', () => {
    const d = tmp()
    writeBuildAnchor(d)
    const plan = detect(d)
    expect(plan.target).toBe('root')
    expect(plan.anchors).toEqual({ build: true, kit: false, index: false })
    expect(plan.missing).toEqual(['kit', 'index'])
    expect(plan.needsConfirmation).toBe(true)
  })

  it('uses an existing presentation app and detects anchors by contract', () => {
    const d = tmp()
    writeBuildAnchor(d)
    // Cosmetically different from the template: other file names, extra code.
    write(path.join(d, 'src/presentation-kit/engine.tsx'), 'export function Presentation() { return null }\n')
    write(path.join(d, 'src/presentation-kit/contract.ts'), 'export interface Step { id: string }\n')
    write(path.join(d, 'src/presentations/index.ts'), 'export const PRESENTATIONS = []\n')
    const plan = detect(d)
    expect(plan.anchors).toEqual({ build: true, kit: true, index: true })
    expect(plan.missing).toEqual([])
    expect(plan.needsConfirmation).toBe(false)
  })

  it('finds an existing presentations/ app inside a monorepo', () => {
    const d = tmp()
    fs.mkdirSync(path.join(d, 'packages'))
    writeBuildAnchor(path.join(d, 'presentations'))
    write(path.join(d, 'presentations/src/presentation-kit/Presentation.tsx'), 'export const Presentation = () => null\nexport type Step = {}\n')
    const plan = detect(d)
    expect(plan.target).toBe('presentations')
    expect(plan.anchors.kit).toBe(true)
  })

  it('does not count a package without a working build as the build anchor', () => {
    const d = tmp()
    write(path.join(d, 'package.json'), JSON.stringify({ dependencies: { react: '1' } }))
    expect(detect(d).anchors.build).toBe(false)
  })
})

describe('scaffold', () => {
  it('fully scaffolds an empty directory without installing when asked not to', () => {
    const d = tmp()
    const report = scaffold(d, { install: false })
    expect(report.installed).toBe(false)
    const plan = detect(d)
    expect(plan.anchors).toEqual({ build: true, kit: true, index: true })
    const idx = fs.readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(idx).toContain("slug: 'getting-started'")
    expect(fs.existsSync(path.join(d, 'src/presentations/getting-started/Talk.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(d, 'package-lock.json'))).toBe(true)
  })

  it('ships the complete dependency set and no styling framework', () => {
    const d = tmp()
    scaffold(d, { install: false })
    const pkg = JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const n of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', 'typescript', 'eslint', 'playwright']) {
      expect(names).toContain(n)
    }
    expect(names.filter((n) => /tailwind/i.test(n))).toEqual([])
  })

  it('on a partial scaffold adds only the missing anchors and preserves existing files', () => {
    const d = tmp()
    writeBuildAnchor(d)
    write(path.join(d, 'src/main.tsx'), "console.log('host entry')\n")
    write(path.join(d, 'README.md'), 'mine\n')
    const before = snapshot(d)
    const report = scaffold(d, { install: false })
    const after = snapshot(d)
    for (const [file, hash] of Object.entries(before)) {
      if (file === 'package.json') continue // dependencies are merged, never replaced
      expect(after[file], `${file} untouched`).toBe(hash)
    }
    expect(report.notes.join()).toMatch(/main\.tsx already exists/)
    expect(detect(d).anchors).toEqual({ build: true, kit: true, index: true })
    // Existing build files were not re-scaffolded.
    expect(fs.existsSync(path.join(d, 'vite.config.ts'))).toBe(false)
    const pkg = JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('host')
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
  })

  it('does nothing when every anchor is already present', () => {
    const d = tmp()
    scaffold(d, { install: false })
    const before = snapshot(d)
    const report = scaffold(d, { install: false })
    expect(report.created).toEqual([])
    expect(report.merged).toEqual([])
    expect(snapshot(d)).toEqual(before)
  })
})

describe('scaffold.mjs command', () => {
  const run = (args: string[], cwd: string) =>
    spawnSync('node', [path.join(SCRIPTS, 'scaffold.mjs'), ...args], { cwd, encoding: 'utf8' })

  it('refuses to write into a non-empty project until confirmed (exit 2)', () => {
    const d = tmp()
    writeBuildAnchor(d)
    const before = snapshot(d)
    const res = run([d, '--no-install'], os.tmpdir())
    expect(res.status).toBe(2)
    expect(JSON.parse(res.stdout).action).toBe('confirm')
    expect(res.stderr).toContain(d)
    expect(snapshot(d)).toEqual(before)
  })

  it('scaffolds a monorepo into presentations/ after confirmation, leaving the root alone', () => {
    const d = tmp()
    writeBuildAnchor(d, { workspaces: ['packages/*'] })
    write(path.join(d, 'packages/lib/index.ts'), 'export {}\n')
    write(path.join(d, 'NOTES.md'), 'keep me\n')
    const before = snapshot(d)
    const res = run([d, '--confirmed', '--no-install'], os.tmpdir())
    expect(res.status, res.stderr).toBe(0)
    const after = snapshot(d)
    for (const [file, hash] of Object.entries(before)) expect(after[file], file).toBe(hash)
    const added = Object.keys(after).filter((f) => !(f in before))
    expect(added.every((f) => f.startsWith(`presentations${path.sep}`))).toBe(true)
    expect(detect(d).anchors).toEqual({ build: true, kit: true, index: true })
    expect(detect(d).appDir).toBe(path.join(d, 'presentations'))
  })

  it('needs no confirmation for an empty directory and works from any cwd', () => {
    const d = tmp()
    const res = run([d, '--no-install'], os.tmpdir())
    expect(res.status, res.stderr).toBe(0)
    expect(JSON.parse(res.stdout).action).toBe('scaffolded')
  })

  it('reports no action when fully scaffolded', () => {
    const d = tmp()
    run([d, '--no-install'], os.tmpdir())
    const again = run([d, '--no-install'], os.tmpdir())
    expect(again.status).toBe(0)
    expect(JSON.parse(again.stdout).action).toBe('none')
  })
})

describe('createPresentation', () => {
  function app(): string {
    const d = tmp()
    scaffold(d, { install: false })
    return d
  }

  it('writes a self-contained folder and registers a routed entry', () => {
    const d = app()
    createPresentation(d, 'my-talk', "It's a Talk")
    for (const f of ['Talk.tsx', 'entities.ts', 'talk.css', 'steps/index.ts', 'steps/Scene.tsx']) {
      expect(fs.existsSync(path.join(d, 'src/presentations/my-talk', f)), f).toBe(true)
    }
    const index = fs.readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(index).toContain("slug: 'my-talk'")
    expect(index).toContain("title: 'It\\'s a Talk'")
    expect(index).toContain("import('./my-talk/Talk')")
    const css = fs.readFileSync(path.join(d, 'src/presentations/my-talk/talk.css'), 'utf8')
    expect(css).toContain('.p-my-talk')
    expect(css).not.toContain('__')
  })

  it('keeps existing presentations intact', () => {
    const d = app()
    const before = snapshot(path.join(d, 'src/presentations/getting-started'))
    createPresentation(d, 'second', 'Second')
    expect(snapshot(path.join(d, 'src/presentations/getting-started'))).toEqual(before)
    const index = fs.readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(index).toContain("slug: 'getting-started'")
    expect(index).toContain("slug: 'second'")
  })

  it('rejects duplicate, unregistered-folder, and invalid slugs', () => {
    const d = app()
    expect(() => createPresentation(d, 'getting-started', 'Dup')).toThrow(/already exists/)
    expect(() => createPresentation(d, 'Bad Slug', 'X')).toThrow(/invalid slug/)
    expect(() => createPresentation(d, '../x', 'X')).toThrow(/invalid slug/)
    fs.rmSync(path.join(d, 'src/presentations/index.ts'))
    expect(() => createPresentation(d, 'fresh', 'X')).toThrow(/no presentation index/)
  })

  it('registers into the array without disturbing surrounding code', () => {
    const src = "export const PRESENTATIONS: P[] = [\n  { slug: 'a' },\n]\nexport const keep = 1\n"
    const out = registerInSource(src, 'b', 'B')
    expect(out).toContain("slug: 'a'")
    expect(out).toContain("slug: 'b'")
    expect(out.endsWith('export const keep = 1\n')).toBe(true)
    expect(() => registerInSource('nothing here', 'b', 'B')).toThrow()
  })
})
