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
    for (const field of ['type', 'private', 'version']) expect(pkg).not.toHaveProperty(field)
    expect(Object.keys(pkg).sort()).toEqual(['dependencies', 'devDependencies', 'name', 'scripts'])
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
  it('reuses a complete nested app from the monorepo root without restoring template files', async () => {
    const root = await temporary()
    await mkdir(join(root, 'packages'))
    const app = join(root, 'presentations')
    await mkdir(join(app, 'custom'), { recursive: true })
    const pkg = { name: 'custom-app', scripts: { build: 'working-custom-build' } }
    await writeFile(join(app, 'package.json'), JSON.stringify(pkg))
    await writeFile(join(app, 'custom/registry.ts'), '// existing custom registry')
    const plan = await planScaffold(root, ['build'], ['build', 'kit', 'index'])
    expect(plan.target).toBe(app)
    expect(plan.missing).toEqual([])
    await materialize(plan)
    expect(await readFile(join(app, 'package.json'), 'utf8')).toBe(JSON.stringify(pkg))
    await expect(readFile(join(app, 'src/presentations/example/Talk.tsx'))).rejects.toThrow('ENOENT')
    await expect(readFile(join(app, 'src/Landing.tsx'))).rejects.toThrow('ENOENT')
    expect(await readFile(join(app, 'custom/registry.ts'), 'utf8')).toBe('// existing custom registry')
  })
  it('preserves partial nested-app anchors and package metadata while adding only its missing kit', async () => {
    const root = await temporary()
    await mkdir(join(root, 'apps'))
    const app = join(root, 'presentations')
    await mkdir(join(app, 'src/presentations'), { recursive: true })
    const pkg = { name: 'commonjs-host', scripts: { build: 'node build.cjs' }, custom: true }
    await writeFile(join(app, 'package.json'), JSON.stringify(pkg))
    await writeFile(join(app, 'src/presentations/index.ts'), '// custom existing index')
    await writeFile(join(app, 'build.cjs'), '// existing commonjs build')
    const plan = await planScaffold(root, ['build'], ['build', 'index'])
    expect(plan.target).toBe(app)
    expect(plan.missing).toEqual(['kit'])
    await materialize(plan, { confirmed: true })
    const result = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
    expect(result.name).toBe(pkg.name)
    expect(result.custom).toBe(true)
    expect(result.scripts.build).toBe('node build.cjs')
    for (const field of ['type', 'private', 'version']) expect(result).not.toHaveProperty(field)
    expect(await readFile(join(app, 'build.cjs'), 'utf8')).toBe('// existing commonjs build')
    expect(await readFile(join(app, 'src/presentations/index.ts'), 'utf8')).toBe('// custom existing index')
    expect(await readFile(join(app, 'src/presentation-kit/Presentation.tsx'), 'utf8')).toContain('Presentation')
    await expect(readFile(join(app, 'src/presentations/example/Talk.tsx'))).rejects.toThrow('ENOENT')
    await expect(readFile(join(root, 'package.json'))).rejects.toThrow('ENOENT')
  })
  it('requires contract inspection before planning an existing non-empty nested target', async () => {
    const root = await temporary()
    await mkdir(join(root, 'packages'))
    await mkdir(join(root, 'presentations'))
    await writeFile(join(root, 'presentations/keep.txt'), 'unrelated')
    await expect(planScaffold(root, ['build'])).rejects.toThrow('confirmed --target-anchors')
    expect((await planScaffold(root, ['build'], [])).missing).toEqual(['build', 'kit', 'index'])
    await expect(planScaffold(root, [], ['unknown'])).rejects.toThrow('Unknown anchor')
  })

})
