import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectAnchors, missingAnchors, planScaffold, resolveTarget } from '../../skills/presentation/scripts/anchors.mjs'
import { buildAnchor, indexAnchor, kitAnchor, tmpDir, write } from './helpers.mjs'

describe('detectAnchors', () => {
  it('finds nothing in an empty directory', () => {
    expect(detectAnchors(tmpDir())).toEqual({ build: false, kit: false, index: false })
  })

  it('finds all three contract anchors', () => {
    const dir = write(tmpDir(), { ...buildAnchor(), ...kitAnchor, ...indexAnchor })
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(missingAnchors(dir)).toEqual([])
  })

  it('tolerates cosmetic differences: extra deps, js config, jsx/tsx naming', () => {
    const dir = write(tmpDir(), {
      ...buildAnchor({ dependencies: { react: '^18', tailwindcss: '^4', zod: '^3' } }),
      
      'vite.config.mjs': 'export default {}',
      'src/presentation-kit/types.js': '',
      'src/presentation-kit/Presentation.jsx': '',
      'src/presentations/index.tsx': '',
    })
    expect(missingAnchors(dir)).toEqual([])
  })

  it('does not count a build setup without vite, react, typescript, or a build script', () => {
    const dir = write(tmpDir(), buildAnchor({ devDependencies: { vite: '^8' } }))
    expect(detectAnchors(dir).build).toBe(false)
    const noScript = write(tmpDir(), { ...buildAnchor(), 'package.json': { dependencies: { react: '1', vite: '1', typescript: '1' } } })
    expect(detectAnchors(noScript).build).toBe(false)
  })

  it('reports only the anchors that are missing (partial scaffold)', () => {
    const dir = write(tmpDir(), { ...buildAnchor(), ...indexAnchor })
    expect(missingAnchors(dir)).toEqual(['kit'])
  })
})

describe('resolveTarget', () => {
  it('uses the root for an empty directory', () => {
    const dir = tmpDir()
    expect(resolveTarget(dir).target).toBe(dir)
  })

  it('uses the root for a standalone project', () => {
    const dir = write(tmpDir(), { ...buildAnchor(), 'src/main.tsx': '' })
    expect(resolveTarget(dir).target).toBe(dir)
  })

  it.each([
    ['package.json workspaces', { 'package.json': { workspaces: ['packages/*'] } }],
    ['pnpm-workspace.yaml', { 'pnpm-workspace.yaml': 'packages: []' }],
    ['packages/ layout', { 'packages/a/index.js': '' }],
    ['apps/ layout', { 'apps/web/index.js': '' }],
  ])('scaffolds a self-contained presentations/ app in a monorepo (%s)', (_name, files) => {
    const dir = write(tmpDir(), files)
    expect(resolveTarget(dir).target).toBe(path.join(dir, 'presentations'))
  })

  it('keeps the monorepo build anchor aside: its root build setup does not make the root the target', () => {
    const dir = write(tmpDir(), { ...buildAnchor({ workspaces: ['apps/*'] }), 'README.md': 'x' })
    const plan = planScaffold(dir)
    expect(plan.target).toBe(path.join(dir, 'presentations'))
    expect(plan.missing).toEqual(['build', 'kit', 'index'])
    expect(plan.needsConfirmation).toBe(true)
  })

  it('uses the current directory when it is already a presentation app', () => {
    const dir = write(tmpDir(), { ...buildAnchor({ workspaces: ['x'] }), ...kitAnchor })
    expect(planScaffold(dir)).toMatchObject({ target: dir, missing: ['index'] })
  })

  it('reuses an existing presentations/ app inside a monorepo', () => {
    const dir = write(tmpDir(), { 'package.json': { workspaces: ['presentations'] }, ...Object.fromEntries(Object.entries({ ...kitAnchor, ...indexAnchor }).map(([k, v]) => [`presentations/${k}`, v])) })
    expect(resolveTarget(dir).target).toBe(path.join(dir, 'presentations'))
  })

  it('needs no confirmation for an empty directory or a complete app', () => {
    expect(planScaffold(tmpDir())).toMatchObject({ missing: ['build', 'kit', 'index'], needsConfirmation: false })
    const full = write(tmpDir(), { ...buildAnchor(), ...kitAnchor, ...indexAnchor })
    expect(planScaffold(full)).toMatchObject({ missing: [], needsConfirmation: false })
  })

  it('requires confirmation for a non-empty project missing scaffolding', () => {
    const dir = write(tmpDir(), { ...buildAnchor(), 'notes.md': 'keep me' })
    expect(planScaffold(dir)).toMatchObject({ missing: ['kit', 'index'], needsConfirmation: true })
  })
})
