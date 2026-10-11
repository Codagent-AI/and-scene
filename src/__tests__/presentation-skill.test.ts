import { describe, expect, it } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const skillDir = path.join(root, 'skills/presentation')
const bootstrap = path.join(skillDir, 'templates/bootstrap')

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory()
    ? (await files(path.join(directory, entry.name))).map((file) => path.join(entry.name, file))
    : [entry.name]))).flat().sort()
}

describe('presentation skill package', () => {
  it('documents the complete gather, scaffold, create, modify, and verification procedure', async () => {
    const skill = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8')
    for (const requirement of [
      'one question at a time', 'partial detail', 'ASCII', 'three anchors', 'contract level',
      'skip scaffolding', 'add only missing anchors', 'full scaffold', 'Playwright', 'style-neutral',
      'relative to this `SKILL.md` file', 'monorepo', 'standalone app at the project root',
      'wait for confirmation', 'preserve all existing routes', 'ambiguous', 'requested edits',
      'npm run build', 'first step', 'runtime or console errors', 'settled screenshots', 'first, last, and dense',
      'Fix failures', 'data-presentation-allow-overlap', 'attribution', 'remaining advisory warnings',
    ]) expect(skill.toLowerCase()).toContain(requirement.toLowerCase())
    expect(skill.split('\n').length).toBeLessThan(200)
  })

  it('keeps the bootstrap kit and browser scripts aligned with canonical files', async () => {
    for (const [canonical, snapshot] of [['src/presentation-kit', 'src/presentation-kit'], ['scripts', 'scripts']] as const) {
      const canonicalFiles = await files(path.join(root, canonical))
      const snapshotFiles = await files(path.join(bootstrap, snapshot))
      const relevant = canonical === 'scripts' ? ['verify.mjs', 'inspect-presentation.mjs'] : canonicalFiles.filter((file) => !file.includes('__tests__'))
      for (const file of relevant) {
        expect(snapshotFiles).toContain(file)
        expect(await readFile(path.join(root, canonical, file), 'utf8')).toBe(await readFile(path.join(bootstrap, snapshot, file), 'utf8'))
      }
    }
  })

  it('ships a registered starter route, reproducible full dependencies, and no kit styling defaults', async () => {
    const packageJson = JSON.parse(await readFile(path.join(bootstrap, 'package.json'), 'utf8'))
    const registry = await readFile(path.join(bootstrap, 'src/presentations/index.ts'), 'utf8')
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) expect(deps[name]).toBeTruthy()
    expect(packageJson.scripts.verify).toContain('--smoke')
    expect(registry).toContain("slug: 'starter'")
    expect(await readFile(path.join(bootstrap, 'package-lock.json'), 'utf8')).toContain('lockfileVersion')
    const kitFiles = await files(path.join(bootstrap, 'src/presentation-kit'))
    const kitText = (await Promise.all(kitFiles.map((file) => readFile(path.join(bootstrap, 'src/presentation-kit', file), 'utf8')))).join('\n')
    expect(kitText).not.toMatch(/tailwind|#[0-9a-f]{3,8}\b|\b(?:font-family|box-shadow|border-radius)\s*:/i)
    expect(await readFile(path.join(bootstrap, 'src/index.css'), 'utf8')).not.toMatch(/#[0-9a-f]{3,8}\b|font-family|box-shadow|border-radius|--[\w-]+\s*:/i)
    expect(await readFile(path.join(bootstrap, '.gitignore'), 'utf8')).toContain('.and-scene/inspection/')
    const presentationTemplate = path.join(skillDir, 'templates/presentation')
    for (const file of ['entities.ts', 'Scene.tsx', 'Talk.tsx', 'presentation.css', 'steps/01.tsx', 'steps/02.tsx']) await expect(readFile(path.join(presentationTemplate, file), 'utf8')).resolves.toBeTruthy()
    const presentationCss = await readFile(path.join(presentationTemplate, 'presentation.css'), 'utf8')
    expect(presentationCss).toContain('[data-presentation-active]')
    expect(presentationCss).toContain('[data-presentation-attribution]')
  })
})
