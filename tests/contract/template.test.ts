import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT, TEMPLATE, read, readJson } from '../helpers/repo.ts'

const RUNTIME = ['react', 'react-dom', 'motion', 'lucide-react']
const DEV = [
  'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node',
  'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
]

describe('bootstrap template dependencies', () => {
  const pkg = readJson(join(TEMPLATE, 'package.json'))
  const lock = JSON.parse(read(join(TEMPLATE, 'package-lock.json'))) as { packages: Record<string, unknown> }

  it.each(RUNTIME)('declares runtime dependency %s', (name) => {
    expect(pkg.dependencies[name]).toBeTruthy()
  })

  it.each(DEV)('declares dev dependency %s', (name) => {
    expect(pkg.devDependencies[name]).toBeTruthy()
  })

  it('declares exactly the build, lint, verify and inspect scripts it needs', () => {
    expect(pkg.scripts).toMatchObject({
      build: 'tsc -b && vite build',
      lint: 'eslint .',
      verify: 'node scripts/verify.mjs',
      inspect: 'node scripts/inspect-presentation.mjs',
    })
  })

  it.each([...RUNTIME, ...DEV])('locks %s in the committed package-lock.json', (name) => {
    expect(lock.packages[`node_modules/${name}`], name).toBeTruthy()
  })

  it('declares the same versions as the app for every shared dependency', () => {
    const rootPkg = readJson(join(ROOT, 'package.json'))
    for (const name of [...RUNTIME, ...DEV]) {
      const rootVersion = rootPkg.dependencies[name] ?? rootPkg.devDependencies[name]
      expect(pkg.dependencies[name] ?? pkg.devDependencies[name], name).toBe(rootVersion)
    }
  })
})

describe('bootstrap template anchors', () => {
  const t = (path: string) => join(TEMPLATE, path)

  it('has a Vite + React + TypeScript build setup', () => {
    for (const file of ['package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'index.html', 'src/main.tsx', 'eslint.config.js']) {
      expect(existsSync(t(file)), file).toBe(true)
    }
    expect(read(t('vite.config.ts'))).toContain('@vitejs/plugin-react')
  })

  it('has the scene kit: step contract, stage, navigation, chrome and fit-scale', () => {
    for (const file of ['types.ts', 'Stage.tsx', 'Presentation.tsx', 'usePresentationNav.ts', 'useFitScale.ts', 'chrome/Header.tsx', 'chrome/Footer.tsx', 'chrome/Toc.tsx', 'nodes/Appear.tsx', 'nodes/SceneLayer.tsx']) {
      expect(existsSync(t(`src/presentation-kit/${file}`)), file).toBe(true)
    }
  })

  it('has a presentation index with a registered, routable example and its verify outline', () => {
    const index = read(t('src/presentations/index.ts'))
    expect(index).toMatch(/slug: 'example'/)
    expect(existsSync(t('src/presentations/example/Talk.tsx'))).toBe(true)
    expect(JSON.parse(read(t('scripts/verify.config.json'))).slug).toBe('example')
  })

  it('defines an example outline that matches its verify data', async () => {
    const outline = JSON.parse(read(t('scripts/verify.config.json'))) as { steps: { era: string; title: string; caption: string }[] }
    const source = read(t('src/presentations/example/steps/steps.ts'))
    for (const step of outline.steps) {
      for (const text of [step.era, step.title, step.caption]) expect(source).toContain(`'${text}'`)
    }
  })
})
