import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, removeDir, run, tempDir } from './helpers.mjs'

// INT-001: the distributable bootstrap, materialized outside the source repository.

const SKILL = path.join(REPO, 'skills', 'presentation')
const BOOTSTRAP = path.join(SKILL, 'templates', 'bootstrap')
const PRESENTATION = path.join(SKILL, 'templates', 'presentation')

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

let dir
let install
let emptyVerify
let build
let lint
let verify
let inspect

/** Copies the presentation starter into the app and registers it, as the skill's create step does. */
function addPresentation(slug, title) {
  const target = path.join(dir, 'src', 'presentations', slug)
  cpSync(PRESENTATION, target, { recursive: true })
  for (const file of walk(target)) {
    writeFileSync(file, readFileSync(file, 'utf8').replaceAll('{{SLUG}}', slug).replaceAll('{{TITLE}}', title))
  }
  const index = path.join(dir, 'src', 'presentations', 'index.ts')
  writeFileSync(
    index,
    readFileSync(index, 'utf8').replace(
      /\n\]/,
      `\n  { slug: '${slug}', title: '${title}', load: () => import('./${slug}/Talk') },\n]`,
    ),
  )
}

beforeAll(async () => {
  dir = tempDir('bootstrap')
  cpSync(BOOTSTRAP, dir, { recursive: true })
  install = await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: dir })
  // Nothing registered yet: the generic verify has nothing to render and must say so.
  emptyVerify = await run('npm', ['run', 'verify'], { cwd: dir })
  addPresentation('smoke', 'Smoke Test')
  build = await run('npm', ['run', 'build'], { cwd: dir })
  lint = await run('npm', ['run', 'lint'], { cwd: dir })
  verify = await run('npm', ['run', 'verify'], { cwd: dir })
  inspect = await run('npm', ['run', 'inspect', '--', 'smoke', '--settle', '100', '--skip-build'], { cwd: dir })
})

afterAll(() => removeDir(dir))

describe('INT-001: materialized bootstrap', () => {
  it('is materialized outside the source repository and found without the caller working directory', () => {
    expect(path.relative(REPO, dir).startsWith('..')).toBe(true)
    expect(BOOTSTRAP).toBe(path.join(REPO, 'skills/presentation/templates/bootstrap'))
    expect(existsSync(path.join(PRESENTATION, 'Talk.tsx'))).toBe(true)
  })

  it('installs from the committed lock data', () => {
    expect(install.code, install.output).toBe(0)
  })

  it('has all three anchors and the complete dependency set installed', () => {
    for (const anchor of ['package.json', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/Stage.tsx', 'src/presentations/index.ts', 'src/Router.tsx']) {
      expect(existsSync(path.join(dir, anchor)), anchor).toBe(true)
    }
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const required of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) {
      expect(declared, required).toContain(required)
      expect(existsSync(path.join(dir, 'node_modules', required, 'package.json')), `${required} installed`).toBe(true)
    }
  })

  it('refuses to pass with nothing registered', () => {
    expect(emptyVerify.code).toBe(1)
    expect(emptyVerify.output).toMatch(/FAIL verify: sample phase failed/)
    expect(emptyVerify.output).toMatch(/no presentations are registered/)
  })

  it('builds, lints, and passes the route smoke check with a registered presentation', () => {
    expect(build.code, build.output).toBe(0)
    expect(lint.code, lint.output).toBe(0)
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/PASS verify: build, sample, render/)
    expect(verify.output).toMatch(/smoke: 2 steps \(http:\/\/127\.0\.0\.1:\d+\)/)
  })

  it('ships a working screenshot helper', () => {
    expect(inspect.code, inspect.output).toBe(0)
    expect(existsSync(path.join(dir, '.inspection/smoke/step-02.png'))).toBe(true)
  })

  it('keeps the non-test kit aligned with the canonical source', () => {
    const files = (root) => walk(root).map((f) => path.relative(root, f)).sort()
    const canonical = path.join(REPO, 'src/presentation-kit')
    const materialized = path.join(dir, 'src/presentation-kit')
    expect(files(materialized)).toEqual(files(canonical))
    for (const file of files(canonical)) {
      expect(readFileSync(path.join(materialized, file), 'utf8'), file).toBe(readFileSync(path.join(canonical, file), 'utf8'))
    }
  })

  it('introduces no styling framework or kit-owned visual defaults', () => {
    const pkg = readFileSync(path.join(dir, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind/i)
    expect(readFileSync(path.join(dir, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
    const css = walk(path.join(dir, 'src')).filter((f) => f.endsWith('.css'))
    expect(css.map((f) => path.relative(dir, f)).sort()).toEqual(['src/index.css', 'src/presentations/smoke/styles.css'])
    expect(readFileSync(path.join(dir, 'src/index.css'), 'utf8')).not.toMatch(/--[\w-]+\s*:|#[0-9a-fA-F]{3,8}\b|font-family|box-shadow/)
    const kitSource = walk(path.join(dir, 'src/presentation-kit')).map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(kitSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bfontFamily\b|\bboxShadow\b|\bbackground\w*\b/)
  })
})
