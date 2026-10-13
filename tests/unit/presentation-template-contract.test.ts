import { expect, it } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

async function files(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await files(full))
    else if (entry.isFile()) result.push(full)
  }
  return result
}

it('keeps the bootstrap kit and shared scripts aligned with the canonical sources', async () => {
  const canonicalKit = await files(path.join(root, 'src/presentation-kit'))
  for (const source of canonicalKit.filter(file => !/\.(test|spec)\.[^.]+$/.test(file))) {
    const relative = path.relative(path.join(root, 'src/presentation-kit'), source)
    const materialized = path.join(bootstrap, 'src/presentation-kit', relative)
    await expect(readFile(materialized)).resolves.toEqual(await readFile(source))
  }
  expect((await files(path.join(bootstrap, 'src/presentation-kit'))).map(file => path.relative(path.join(bootstrap, 'src/presentation-kit'), file)).sort())
    .toEqual(canonicalKit.filter(file => !/\.(test|spec)\.[^.]+$/.test(file)).map(file => path.relative(path.join(root, 'src/presentation-kit'), file)).sort())
  for (const name of ['verify.mjs', 'inspect-presentation.mjs']) {
    const [templateScript, rootScript] = await Promise.all([
      readFile(path.join(bootstrap, 'scripts', name), 'utf8'),
      readFile(path.join(root, 'scripts', name), 'utf8'),
    ])
    if (name === 'verify.mjs') {
      const withoutRootSampleCheck = rootScript
        .replace("import expectedOutline from './sample-outline.json' with { type: 'json' }\n", '')
        .replace(/async function checkSample\(\) \{[\s\S]*?\n\}\n\n/, '')
        .replace("    phase = 'sample'\n    await checkSample()\n", '')
        .replace('build, sample, and registered route rendering', 'build and registered route rendering')
      expect(templateScript).toBe(withoutRootSampleCheck)
    } else expect(templateScript).toBe(rootScript)
  }
})

it('declares the full neutral bootstrap dependency contract', async () => {
  const pkg = JSON.parse(await readFile(path.join(bootstrap, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
  for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[name]).toBeTruthy()
  for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) expect(pkg.devDependencies[name]).toBeTruthy()
  const content = (await Promise.all((await files(bootstrap)).map(file => readFile(file, 'utf8').catch(() => '')))).join('\n')
  expect(content).not.toMatch(/tailwind|@tailwindcss/i)
  const kit = (await Promise.all((await files(path.join(bootstrap, 'src/presentation-kit'))).map(file => readFile(file, 'utf8')))).join('\n')
  expect(kit).not.toMatch(/\b(?:#[0-9a-f]{3,8}|rgba?\(|hsla?\(|font-family|box-shadow|border-radius|border-color|tailwind)\b/i)
  expect(pkg).toBeDefined()
})
