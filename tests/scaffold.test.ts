// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error JavaScript distributable script intentionally has no build dependency
import { detectAnchors, resolveTarget, scaffold, templateRoot } from '../skills/presentation/scaffold.mjs'
const roots: string[] = []
function temp() { const p = mkdtempSync(join(tmpdir(), 'scene-scaffold-')); roots.push(p); return p }
function put(root: string, path: string, text: string) { const full = join(root, path); mkdirSync(join(full, '..'), { recursive: true }); writeFileSync(full, text) }
afterEach(() => roots.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })))
describe('scaffold contracts', () => {
  it('I-22 detects conventional anchors independently and accepts semantic overrides', () => {
    const root = temp()
    expect(detectAnchors(root)).toEqual({ build: false, kit: false, index: false })
    put(root, 'package.json', JSON.stringify({ scripts: { build: 'custom-build' }, dependencies: { extra: '1' } }))
    put(root, 'index.html', 'host'); put(root, 'tsconfig.json', '{}')
    expect(detectAnchors(root).build).toBe(true)
    const result = scaffold({ cwd: root, anchors: { build: true, kit: true, index: true } })
    expect(result.reused).toBe(true); expect(result.copied).toEqual([])
  })
  it('I-23 fully scaffolds missing anchors and preserves partial host infrastructure', () => {
    const fresh = temp(); scaffold({ cwd: fresh })
    expect(detectAnchors(fresh)).toEqual({ build: true, kit: true, index: true })
    const root = temp(); put(root, 'package.json', JSON.stringify({ scripts: { build: 'keep-this' }, dependencies: { custom: '1.0.0' } }))
    put(root, 'index.html', 'keep html'); put(root, 'tsconfig.json', '{}'); put(root, 'src/unrelated.ts', 'keep')
    scaffold({ cwd: root, confirmed: true })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe('keep html')
    expect(readFileSync(join(root, 'src/unrelated.ts'), 'utf8')).toBe('keep')
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('keep-this'); expect(pkg.dependencies.custom).toBe('1.0.0')
    expect(existsSync(join(root, 'scripts/verify.mjs'))).toBe(true)
    expect(existsSync(join(root, 'scripts/inspect-presentation.mjs'))).toBe(true)
    expect(pkg.dependencies.motion).toBeTruthy(); expect(pkg.devDependencies.playwright).toBeTruthy()
    expect(detectAnchors(root)).toEqual({ build: true, kit: true, index: true })
  })
  it('I-25 resolves templates independently of caller working directory', () => {
    const previous = process.cwd(); const other = temp()
    try { process.chdir(other); expect(templateRoot).toContain('skills/presentation/templates/bootstrap'); const root = temp(); scaffold({ cwd: root }); expect(detectAnchors(root).kit).toBe(true) }
    finally { process.chdir(previous) }
  })
  it('I-26 resolves standalone root and all monorepo signals, reusing established apps', () => {
    const root = temp(); expect(resolveTarget(root)).toBe(root)
    for (const signal of ['apps', 'packages', 'pnpm-workspace.yaml']) {
      put(root, signal, ''); expect(resolveTarget(root)).toBe(join(root, 'presentations')); rmSync(join(root, signal))
    }
    put(root, 'package.json', '{"workspaces":["apps/*"]}')
    expect(resolveTarget(root)).toBe(join(root, 'presentations'))
    expect(resolveTarget(root, { build: true, kit: true, index: true })).toBe(root)
    expect(resolveTarget(root, { build: true, kit: true, index: false })).toBe(join(root, 'presentations'))
    expect(resolveTarget(root, { build: true, kit: false, index: true })).toBe(join(root, 'presentations'))
    scaffold({ cwd: root, confirmed: true })
    expect(detectAnchors(join(root, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe('{"workspaces":["apps/*"]}')
  })
  it('I-27 refuses non-empty scaffold writes before target confirmation', () => {
    const root = temp(); put(root, 'notes.txt', 'unchanged')
    expect(() => scaffold({ cwd: root })).toThrow(`Confirmation required before scaffolding ${root}`)
    expect(detectAnchors(root)).toEqual({ build: false, kit: false, index: false })
    expect(readFileSync(join(root, 'notes.txt'), 'utf8')).toBe('unchanged')
    expect(scaffold({ cwd: root, confirmed: true }).reused).toBe(false)
  })
})
