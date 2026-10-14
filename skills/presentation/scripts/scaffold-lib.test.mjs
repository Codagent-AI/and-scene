import { cpSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectAnchors, detectMonorepo, mergeDependencies, resolveTarget, templatesDir } from './scaffold-lib.mjs'

const tmp = () => mkdtempSync(path.join(tmpdir(), 'skill-lib-'))
const bootstrap = templatesDir('bootstrap')

describe('templatesDir', () => {
  it('resolves next to SKILL.md regardless of cwd', () => {
    const before = process.cwd()
    process.chdir(tmpdir())
    try {
      expect(existsSync(path.join(templatesDir(), 'package.json'))).toBe(true)
      expect(existsSync(path.join(templatesDir('presentation'), 'Talk.tsx.tmpl'))).toBe(true)
    } finally {
      process.chdir(before)
    }
  })
})

describe('detectMonorepo', () => {
  it('detects each signal and none for a plain project', () => {
    const plain = tmp()
    writeFileSync(path.join(plain, 'package.json'), '{}')
    expect(detectMonorepo(plain).isMonorepo).toBe(false)
    const ws = tmp()
    writeFileSync(path.join(ws, 'package.json'), '{"workspaces":["a"]}')
    expect(detectMonorepo(ws).signals).toEqual(['workspaces'])
    const pnpm = tmp()
    writeFileSync(path.join(pnpm, 'pnpm-workspace.yaml'), 'packages: []')
    expect(detectMonorepo(pnpm).signals).toEqual(['pnpm-workspace.yaml'])
    const apps = tmp()
    mkdirSync(path.join(apps, 'apps'))
    expect(detectMonorepo(apps).signals).toEqual(['apps/'])
  })
})

describe('detectAnchors / resolveTarget', () => {
  it('finds all anchors in the bootstrap template', () => {
    expect(detectAnchors(bootstrap)).toEqual({ buildSetup: true, sceneKit: true, presentationIndex: true })
    expect(resolveTarget(bootstrap).kind).toBe('existing-app')
  })

  it('empty directory scaffolds at the root without confirmation', () => {
    const r = resolveTarget(tmp())
    expect(r).toMatchObject({ kind: 'root', needsConfirmation: false })
    expect(r.anchors).toEqual({ buildSetup: false, sceneKit: false, presentationIndex: false })
  })

  it('non-empty standalone project missing the kit needs confirmation', () => {
    const d = tmp()
    writeFileSync(path.join(d, 'package.json'), '{}')
    expect(resolveTarget(d)).toMatchObject({ kind: 'root', needsConfirmation: true })
  })

  it('monorepo targets presentations/ and reuses an existing app there', () => {
    const d = tmp()
    writeFileSync(path.join(d, 'package.json'), '{"workspaces":["packages/*"]}')
    const r = resolveTarget(d)
    expect(r).toMatchObject({ kind: 'monorepo-app', target: path.join(d, 'presentations'), needsConfirmation: true })
    cpSync(bootstrap, path.join(d, 'presentations'), { recursive: true })
    expect(resolveTarget(d)).toMatchObject({ kind: 'existing-app', target: path.join(d, 'presentations') })
  })

  it('detects a partial scaffold', () => {
    const d = tmp()
    cpSync(bootstrap, d, { recursive: true, filter: (s) => !s.includes('presentation-kit') })
    expect(detectAnchors(d)).toEqual({ buildSetup: true, sceneKit: false, presentationIndex: true })
  })
})

describe('mergeDependencies', () => {
  it('adds only missing packages and scripts and never overwrites', () => {
    const { pkg, added } = mergeDependencies(
      { name: 'x', scripts: { build: 'custom' }, dependencies: { react: '^18.0.0' } },
      { scripts: { build: 'tsc', verify: 'node v' }, dependencies: { react: '^19', motion: '^12' }, devDependencies: { vite: '^8' } },
    )
    expect(pkg.dependencies).toEqual({ react: '^18.0.0', motion: '^12' })
    expect(pkg.devDependencies).toEqual({ vite: '^8' })
    expect(pkg.scripts).toEqual({ build: 'custom', verify: 'node v' })
    expect(added.sort()).toEqual(['motion', 'vite'])
  })
})
