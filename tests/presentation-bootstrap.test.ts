import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')
const execFileAsync = promisify(execFile)

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? (await filesUnder(absolute)).map((file) => path.join(entry.name, file)) : [entry.name]
  }))
  return files.flat().sort()
}

function copyTemplate(source: string, destination: string): Promise<void> {
  return cp(source, destination, { recursive: true, filter: (file) => !['node_modules', 'dist'].includes(path.basename(file)) })
}

describe('presentation bootstrap template', () => {
  it('materializes a buildable, style-neutral app with canonical kit parity', async () => {
    const temp = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
    try {
      await copyTemplate(bootstrap, temp)
      const packageJson = JSON.parse(await readFile(path.join(temp, 'package.json'), 'utf8')) as {
        scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string>
      }
      expect(packageJson.scripts.build).toBeTruthy()
      expect(packageJson.scripts.verify).toBeTruthy()
      expect(packageJson.scripts.inspect).toBeTruthy()
      for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) expect(packageJson.dependencies[dependency]).toBeTruthy()
      for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) expect(packageJson.devDependencies[dependency]).toBeTruthy()

      const presentationTemplate = path.join(root, 'skills/presentation/templates/presentation')
      for (const source of ['Talk.tsx', 'steps/Scene.tsx', 'steps/index.tsx']) {
        const code = await readFile(path.join(presentationTemplate, source), 'utf8')
        for (const [, imported] of code.matchAll(/import ['"](.+\.css)['"]/g)) {
          expect(await readFile(path.resolve(presentationTemplate, path.dirname(source), imported), 'utf8')).toBeTruthy()
        }
      }
      const verifySource = await readFile(path.join(bootstrap, 'scripts/verify.mjs'), 'utf8')
      const inspectSource = await readFile(path.join(bootstrap, 'scripts/inspect-presentation.mjs'), 'utf8')
      expect(verifySource).toMatch(/process\.argv\[2\]/)
      expect(verifySource).toMatch(/encodeURIComponent\(slug\)/)
      expect(verifySource).toMatch(/import\s*\{\s*preview\s*\}\s*from\s*['"]vite['"]/)
      expect(inspectSource).toMatch(/import\s*\{\s*preview\s*\}\s*from\s*['"]vite['"]/)

      for (const anchor of ['vite.config.ts', 'src/presentation-kit/index.ts', 'src/presentations/index.ts']) {
        expect(await readFile(path.join(temp, anchor), 'utf8')).toBeTruthy()
      }
      const canonicalFiles = (await filesUnder(path.join(root, 'src/presentation-kit'))).filter((file) => !file.includes('.test.'))
      const templateFiles = (await filesUnder(path.join(bootstrap, 'src/presentation-kit'))).filter((file) => !file.includes('.test.'))
      expect(templateFiles).toEqual(canonicalFiles)
      for (const file of canonicalFiles) {
        expect(await readFile(path.join(bootstrap, 'src/presentation-kit', file))).toEqual(await readFile(path.join(root, 'src/presentation-kit', file)))
      }

      const kitSource = (await Promise.all(canonicalFiles.map((file) => readFile(path.join(bootstrap, 'src/presentation-kit', file), 'utf8')))).join('\n')
      const styles = await readFile(path.join(bootstrap, 'src/index.css'), 'utf8')
      expect(`${kitSource}\n${styles}`).not.toMatch(/tailwind|@theme|--color-|--font-|box-shadow\s*:/i)
      const skill = await readFile(path.join(root, 'skills/presentation/SKILL.md'), 'utf8')
      expect(skill).toMatch(/templates\/bootstrap/)
      expect(skill).toMatch(/SKILL\.md.*relative|relative.*SKILL\.md/is)
      expect(skill).toMatch(/npm run verify -- <slug>/)
      await execFileAsync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: temp })
      const registry = path.join(temp, 'src/presentations/index.ts')
      const registrySource = await readFile(registry, 'utf8')
      await writeFile(registry, registrySource.replace("slug: 'starter'", 'slug : "contract-check"'))
      try {
        await execFileAsync('npm', ['run', 'build'], { cwd: temp })
      } catch (error) {
        const detail = error as Error & { stdout?: string; stderr?: string }
        throw new Error(`${detail.message}\n${detail.stdout ?? ''}\n${detail.stderr ?? ''}`, { cause: error })
      }
      await execFileAsync('npm', ['run', 'verify', '--', 'contract-check'], { cwd: temp })
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  }, 180_000)
})
