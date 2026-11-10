import { cp, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { it, expect } from 'vitest'
import { command, temporary, remove, root, success, assertCleaned } from './helpers.mjs'
async function compare(a, b) {
  const entries = await readdir(a, { withFileTypes: true })
  expect((await readdir(b)).sort()).toEqual(entries.map(e => e.name).sort())
  for (const entry of entries) {
    if (entry.isDirectory()) await compare(join(a, entry.name), join(b, entry.name))
    else expect(await readFile(join(b, entry.name), 'utf8')).toBe(await readFile(join(a, entry.name), 'utf8'))
  }
}
it('INT-001 materialized bootstrap builds renders resolves externally and stays style-neutral and aligned', async () => {
  const directory = await temporary()
  try {
    success(command(directory, ['node', join(root, 'skills/presentation/scripts/materialize.mjs'), directory]))
    const collision = command(directory, ['node', join(root, 'skills/presentation/scripts/materialize.mjs'), directory])
    expect(collision.status).not.toBe(0); expect(collision.output).toContain('non-empty')
    const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) expect({ ...pkg.dependencies, ...pkg.devDependencies }).toHaveProperty(dep)
    expect(JSON.stringify(pkg)).not.toMatch(/tailwind/)
    expect(await readFile(join(directory, 'src/index.css'), 'utf8')).not.toMatch(/[{}]/)
    await compare(join(root, 'src/presentation-kit'), join(directory, 'src/presentation-kit'))
    for (const name of ['browser.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'diagnostics.mjs', 'reference.mjs']) expect(await readFile(join(directory, 'scripts', name), 'utf8')).toBe(await readFile(join(root, 'scripts', name), 'utf8'))
    // A generated presentation is supplied separately; bootstrap carries no theme.
    await cp(join(root, 'skills/presentation/templates/presentation'), join(directory, 'src/presentations/starter'), { recursive: true })
    for (const file of ['Talk.tsx', 'entities.ts', 'steps/index.tsx']) {
      const path = join(directory, 'src/presentations/starter', file)
      await writeFile(path, (await readFile(path, 'utf8')).replaceAll('__SLUG__', 'starter').replaceAll('__TITLE__', 'Starter'))
    }
    await writeFile(join(directory, 'src/presentations/index.ts'), `export const presentations = [{ slug: 'starter', title: 'Starter', load: () => import('./starter/Talk') }]\n`)
    success(command(directory, ['npm', 'ci', '--no-audit', '--no-fund']))
    const output = success(command(directory, ['npm', 'run', 'verify', '--', 'starter']))
    expect(output).toContain('PASS verify starter: 2 steps')
    assertCleaned(output)
    console.log(output)
  } finally { await remove(directory) }
})
