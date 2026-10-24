// INT-001: the distributable bootstrap template, materialized outside the repository.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeAll, describe, expect, inject, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/anchors.mjs'
import { REPO_ROOT, run } from '../helpers/project.mjs'

const dir = inject('materialized')
const SCAFFOLD = path.join(REPO_ROOT, 'skills/presentation/scripts/scaffold.mjs')
const read = (rel) => fs.readFileSync(path.join(dir, rel), 'utf8')
const list = (root) =>
  fs
    .readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(root, path.join(e.parentPath, e.name)))

describe('materialized bootstrap template', () => {
  let build
  let verify

  beforeAll(async () => {
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-cwd-'))
    const created = await run(process.execPath, [SCAFFOLD, 'create', '--target', dir, '--slug', 'second-talk', '--title', 'Second Talk'], { cwd: elsewhere })
    expect(created.code, created.output).toBe(0)
    build = await run('npm', ['run', 'build'], { cwd: dir })
    verify = await run('npm', ['run', 'verify', '--', '--skip-build'], { cwd: dir })
  })

  it('has all three anchors', () => {
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('installs the complete dependency set from the committed lock data', () => {
    const pkg = JSON.parse(read('package.json'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(deps[dep], `${dep} declared`).toBeTruthy()
      expect(fs.existsSync(path.join(dir, 'node_modules', dep, 'package.json')), `${dep} installed`).toBe(true)
    }
    expect(fs.existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
  })

  it('builds with no type errors', () => {
    expect(build.code, build.output).toBe(0)
  })

  it('passes the local verification entry point on its registered routes', () => {
    expect(verify.code, verify.output).toBe(0)
    expect(verify.stdout).toContain('VERIFY PASS')
    expect(verify.stdout).toContain('render hello-scene: 3 steps ok')
    expect(verify.stdout).toContain('render second-talk: 3 steps ok')
    expect(verify.stdout).toMatch(/preview http:\/\/127\.0\.0\.1:\d+/)
  })

  it('passes its own lint', async () => {
    const lint = await run('npm', ['run', 'lint'], { cwd: dir })
    expect(lint.code, lint.output).toBe(0)
  })

  it('keeps the kit aligned with the canonical source', () => {
    const canonical = path.join(REPO_ROOT, 'src/presentation-kit')
    const files = list(canonical).filter((f) => !f.startsWith('__tests__'))
    expect(files.length).toBeGreaterThan(15)
    for (const rel of files) {
      const copy = path.join(dir, 'src/presentation-kit', rel)
      expect(fs.existsSync(copy), rel).toBe(true)
      expect(fs.readFileSync(copy).equals(fs.readFileSync(path.join(canonical, rel))), rel).toBe(true)
    }
    expect(list(path.join(dir, 'src/presentation-kit')).sort()).toEqual(files.sort())
  })

  it('introduces no Tailwind or visual defaults', () => {
    expect(JSON.stringify(JSON.parse(read('package.json')))).not.toMatch(/tailwind/i)
    for (const rel of list(path.join(dir, 'src')).filter((f) => f.endsWith('.css'))) {
      const css = read(path.join('src', rel)).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css, rel).not.toMatch(/(^|[\s;{])(color|background(-color)?|font(-family)?|border(-color)?|box-shadow)\s*:/)
    }
    for (const rel of list(path.join(dir, 'src/presentation-kit'))) {
      expect(read(path.join('src/presentation-kit', rel)), rel).not.toMatch(/tailwind|#[0-9a-fA-F]{3,8}\b|rgba?\(/i)
    }
  })

  it('resolved templates independently of the calling directory', () => {
    const output = JSON.parse(inject('scaffoldOutput'))
    expect(output.missing).toEqual(['build', 'kit', 'index'])
    expect(output.created).toEqual(expect.arrayContaining(['package.json', 'package-lock.json', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts']))
    expect(output.installed).toBe(true)
  })
})
