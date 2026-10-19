import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ANCHORS,
  STYLING_FRAMEWORK_NAME,
  STYLING_FRAMEWORK_TEXT,
  anchorProblems,
  compareKitTrees,
  dependencyProblems,
  lockPackageNames,
  presentationFindings,
  stylesheetProblems,
} from './helpers/bootstrap'
import { KIT_DIRS, REPO_ROOT, scanKitSources } from './helpers/kit-scan'

const TEMPLATE_REL = 'skills/presentation/templates/bootstrap'
const TEMPLATE = join(REPO_ROOT, TEMPLATE_REL)
const readJson = (root: string, rel: string) => JSON.parse(readFileSync(join(root, rel), 'utf8'))
const readText = (root: string, rel: string) => readFileSync(join(root, rel), 'utf8')

const scratch: string[] = []
afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true })
})
function tempDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'bootstrap-parity-'))
  scratch.push(dir)
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true })
    writeFileSync(join(dir, rel), text)
  }
  return dir
}

describe('bootstrap kit parity (L-37, L-11)', () => {
  it('template kit has the same non-test file set and bytes as src/presentation-kit', () => {
    expect(compareKitTrees(join(REPO_ROOT, 'src/presentation-kit'), join(TEMPLATE, 'src/presentation-kit'))).toEqual([])
  })

  it('negative control: the comparer flags a changed byte, an extra file, a missing file and a leaked test', () => {
    const canonical = tempDir({
      'src/presentation-kit/a.ts': 'export const a = 1\n',
      'src/presentation-kit/nodes/b.tsx': 'export const b = 2\n',
      'src/presentation-kit/__fixtures__/f.tsx': 'export const f = 0\n',
      'src/presentation-kit/a.test.ts': 'test\n',
    })
    const canonicalKit = join(canonical, 'src/presentation-kit')
    const equalCopy = tempDir({ 'k/a.ts': 'export const a = 1\n', 'k/nodes/b.tsx': 'export const b = 2\n' })
    expect(compareKitTrees(canonicalKit, join(equalCopy, 'k'))).toEqual([])

    const changedByte = tempDir({ 'k/a.ts': 'export const a = 2\n', 'k/nodes/b.tsx': 'export const b = 2\n' })
    expect(compareKitTrees(canonicalKit, join(changedByte, 'k'))).toEqual(['bytes differ: a.ts'])

    const extra = tempDir({ 'k/a.ts': 'export const a = 1\n', 'k/nodes/b.tsx': 'export const b = 2\n', 'k/extra.ts': 'x\n' })
    expect(compareKitTrees(canonicalKit, join(extra, 'k'))).toEqual(['extra in copy: extra.ts'])

    const missing = tempDir({ 'k/a.ts': 'export const a = 1\n' })
    expect(compareKitTrees(canonicalKit, join(missing, 'k'))).toEqual(['missing in copy: nodes/b.tsx'])

    const leaked = tempDir({ 'k/a.ts': 'export const a = 1\n', 'k/nodes/b.tsx': 'export const b = 2\n', 'k/a.test.ts': 'x\n' })
    expect(compareKitTrees(canonicalKit, join(leaked, 'k'))).toEqual(['test or fixture file in copy: a.test.ts'])
  })

  it('verify.mjs and inspect-presentation.mjs are byte-equal to their template copies', () => {
    for (const name of ['verify.mjs', 'inspect-presentation.mjs']) {
      expect(readFileSync(join(REPO_ROOT, 'scripts', name)).equals(readFileSync(join(TEMPLATE, 'scripts', name))), name).toBe(true)
    }
  })

  it('root and template package.json both define verify and inspect entry points', () => {
    for (const root of [REPO_ROOT, TEMPLATE]) {
      const scripts = readJson(root, 'package.json').scripts
      expect(scripts.verify).toBe('node scripts/verify.mjs')
      expect(scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
    }
  })

  it('the template kit is part of the neutrality and import-graph scans', () => {
    expect(KIT_DIRS).toContain(TEMPLATE_REL + '/src/presentation-kit')
  })
})

describe('bootstrap manifest contract (L-33, L-12)', () => {
  it('package.json declares the full required dependency set', () => {
    expect(dependencyProblems(readJson(TEMPLATE, 'package.json'))).toEqual([])
    expect(dependencyProblems({ dependencies: {}, devDependencies: {} }).length).toBeGreaterThan(0)
  })

  it('package-lock.json records every direct dependency at the root and installs each one', () => {
    const pkg = readJson(TEMPLATE, 'package.json')
    const lock = readJson(TEMPLATE, 'package-lock.json')
    const root = lock.packages[''] ?? {}
    expect({ ...root.dependencies, ...root.devDependencies }).toEqual({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const name of [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]) {
      expect(lock.packages[`node_modules/${name}`], name).toBeDefined()
    }
  })

  it('no styling framework appears in package.json, the lock packages, or the configs', () => {
    const pkg = readJson(TEMPLATE, 'package.json')
    const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]
    expect(names.filter((n) => STYLING_FRAMEWORK_NAME.test(n))).toEqual([])
    expect(lockPackageNames(readJson(TEMPLATE, 'package-lock.json')).filter((n) => STYLING_FRAMEWORK_NAME.test(n))).toEqual([])
    for (const rel of ['vite.config.ts', 'eslint.config.js', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html', 'package.json']) {
      expect(readText(TEMPLATE, rel), rel).not.toMatch(STYLING_FRAMEWORK_TEXT)
    }
  })

  it('negative control: the framework scan flags a planted Tailwind dependency and lock entry', () => {
    expect(STYLING_FRAMEWORK_NAME.test('tailwindcss')).toBe(true)
    expect(STYLING_FRAMEWORK_NAME.test('@tailwindcss/vite')).toBe(true)
    expect(STYLING_FRAMEWORK_NAME.test('styled-components')).toBe(true)
    expect(lockPackageNames({ packages: { '': {}, 'node_modules/x/node_modules/tailwindcss': {} } })).toEqual(['tailwindcss'])
    expect(STYLING_FRAMEWORK_TEXT.test("import '@tailwindcss/vite'")).toBe(true)
  })
})

describe('bootstrap anchors (presentation-skill, self-bootstrapping scaffold)', () => {
  it('build setup, scene kit and presentation index anchors are present and wired', () => {
    expect(anchorProblems(TEMPLATE)).toEqual([])
    expect(Object.keys(ANCHORS)).toEqual(['build', 'kit', 'index'])
  })

  it('negative control: an empty directory fails every anchor', () => {
    const dir = tempDir({ 'placeholder.txt': 'x' })
    expect(anchorProblems(dir).length).toBeGreaterThan(ANCHORS.build.length)
  })
})

describe('bootstrap style neutrality (L-11)', () => {
  it('the host stylesheet carries only layout plumbing', () => {
    expect(stylesheetProblems(readText(TEMPLATE, 'src/index.css'))).toEqual([])
  })

  it('the starter presentation has no visual declarations or stylesheets', () => {
    expect(presentationFindings(TEMPLATE, 'src/presentations/starter')).toEqual([])
  })

  it('negative control: planted palette, font, spacing or inline colour are flagged', () => {
    expect(stylesheetProblems('body { font-family: Inter; color: red; padding: 8px }')).toEqual([
      'font-family: Inter',
      'color: red',
      'padding: 8px',
    ])
    const findings = scanKitSources([{ file: 'Scene.tsx', text: "<g style={{ color: 'red', fill: '#f00' }} />\n" }])
    expect(findings.map((f) => f.category)).toEqual(expect.arrayContaining(['visual-declaration', 'color-value']))
  })
})

describe('bootstrap repository hygiene (L-65)', () => {
  it('git tracks nothing generated, installed or screenshot-like under the template', () => {
    const tracked = execFileSync('git', ['ls-files', '--', TEMPLATE_REL], { cwd: REPO_ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
    const bad = tracked.filter((f) => /(^|\/)(node_modules|dist|\.inspection)\//.test(f) || /(^|\/)step-\d+\.png$/.test(f))
    expect(bad).toEqual([])
    expect(tracked.filter((f) => /\.github\/workflows\//.test(f))).toEqual([])
  })

  it('the template ignore file excludes dependencies, build output and inspection screenshots', () => {
    const lines = readText(TEMPLATE, '.gitignore').split('\n').map((l) => l.trim())
    for (const entry of ['node_modules', 'dist', '.inspection']) expect(lines).toContain(entry)
  })

  it('the template is outside the root lint and typecheck scope', () => {
    expect(readText(REPO_ROOT, 'eslint.config.js')).toContain("'skills/**/templates/**'")
    expect(readText(REPO_ROOT, 'tsconfig.app.json')).toMatch(/"include":\s*\[\s*"src"\s*\]/)
  })
})

