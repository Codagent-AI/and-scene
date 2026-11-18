// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { materialize, planScaffold, templateRoot } from '../skills/presentation/scripts/scaffold.mjs'

const roots = []
async function temporary() {
  const root = await mkdtemp(join(tmpdir(), 'and-scene-plan-'))
  roots.push(root)
  return root
}
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })

describe('scaffold contracts', () => {
  it('plans standalone roots and all three missing anchors', async () => {
    const root = await temporary()
    expect(await planScaffold(root)).toEqual({ root, target: root, missing: ['build', 'kit', 'index'], confirmationRequired: false })
    expect(templateRoot).toMatch(/skills\/presentation\/templates\/bootstrap\/$/)
  })
  it.each(['workspaces', 'pnpm', 'packages', 'apps'])('plans a self-contained monorepo app for %s', async signal => {
    const root = await temporary()
    if (signal === 'workspaces') await writeFile(join(root, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }))
    else if (signal === 'pnpm') await writeFile(join(root, 'pnpm-workspace.yaml'), 'packages: []')
    else await mkdir(join(root, signal))
    const plan = await planScaffold(root, ['build'])
    expect(plan.target).toBe(join(root, 'presentations'))
    expect(plan.missing).toEqual(['build', 'kit', 'index'])
    expect(plan.confirmationRequired).toBe(true)
  })
  it('reuses a complete existing app despite workspace signals', async () => {
    const root = await temporary()
    await mkdir(join(root, 'packages'))
    const plan = await planScaffold(root, ['build', 'kit', 'index'])
    expect(plan.target).toBe(root)
    expect(plan.missing).toEqual([])
    await expect(materialize(plan)).resolves.toEqual(plan)
  })
  it('rejects writes without confirmation and rejects unknown anchors', async () => {
    const root = await temporary()
    await writeFile(join(root, 'keep.txt'), 'keep')
    await expect(materialize(await planScaffold(root))).rejects.toThrow('Confirmation required')
    await expect(planScaffold(root, ['unknown'])).rejects.toThrow('Unknown anchor')
  })
  it('copies only missing anchors and preserves the existing build and package scripts', async () => {
    const root = await temporary()
    const current = { name: 'existing-host', scripts: { build: 'custom-build' }, dependencies: { react: '19.2.6' } }
    await writeFile(join(root, 'package.json'), JSON.stringify(current))
    await mkdir(join(root, 'src'))
    await writeFile(join(root, 'src/main.tsx'), '// existing entry')
    await materialize(await planScaffold(root, ['build']), { confirmed: true })
    expect(await readFile(join(root, 'src/main.tsx'), 'utf8')).toBe('// existing entry')
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('existing-host')
    expect(pkg.scripts.build).toBe('custom-build')
    expect(pkg.dependencies.react).toBe('19.2.6')
    expect(pkg.devDependencies.playwright).toBeTruthy()
    expect(await readFile(join(root, 'src/presentations/index.ts'), 'utf8')).toContain('example')
  })
  it('does not replace an existing registry when adding the missing kit', async () => {
    const root = await temporary()
    await mkdir(join(root, 'src/presentations'), { recursive: true })
    await writeFile(join(root, 'src/presentations/index.ts'), 'export const presentations = []')
    await materialize(await planScaffold(root, ['build', 'index']), { confirmed: true })
    expect(await readFile(join(root, 'src/presentations/index.ts'), 'utf8')).toBe('export const presentations = []')
  })
})
