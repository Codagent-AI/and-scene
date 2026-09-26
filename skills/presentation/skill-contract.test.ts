import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.dirname(fileURLToPath(import.meta.url))

describe('presentation skill distribution', () => {
  it('includes a complete bootstrap with canonical kit parity and no kit styling defaults', async () => {
    const bootstrap = path.join(root, 'templates/bootstrap')
    const packageJson = JSON.parse(await readFile(path.join(bootstrap, 'package.json'), 'utf8'))
    expect(packageJson.scripts.build).toBeDefined()
    expect(packageJson.scripts.verify).toBeDefined()
    expect(packageJson.dependencies).toMatchObject({ react: expect.any(String), 'react-dom': expect.any(String), motion: expect.any(String), 'lucide-react': expect.any(String) })
    expect(packageJson.devDependencies).toMatchObject({ vite: expect.any(String), '@vitejs/plugin-react': expect.any(String), typescript: expect.any(String), playwright: expect.any(String), eslint: expect.any(String) })
    const listFiles = async (directory: string, prefix = ''): Promise<string[]> => {
      const entries = await readdir(directory, { withFileTypes: true })
      const files = await Promise.all(entries.map((entry) => entry.isDirectory()
        ? listFiles(path.join(directory, entry.name), path.join(prefix, entry.name))
        : [path.join(prefix, entry.name)]))
      return files.flat()
    }
    const sourceRoot = path.resolve(root, '../../src/presentation-kit')
    const sourceFiles = (await listFiles(sourceRoot)).filter((file) => !/\.test\.[tj]sx?$/.test(file)).sort()
    const templateFiles = (await listFiles(path.join(bootstrap, 'src/presentation-kit'))).sort()
    expect(templateFiles).toEqual(sourceFiles)
    for (const file of sourceFiles) {
      expect(await readFile(path.join(bootstrap, 'src/presentation-kit', file), 'utf8')).toBe(await readFile(path.join(sourceRoot, file), 'utf8'))
    }
    expect(JSON.stringify(packageJson)).not.toMatch(/tailwind/i)
  })

  it('documents interactive gathering, safe target resolution, scoped edits, and verification', async () => {
    const skill = await readFile(path.join(root, 'SKILL.md'), 'utf8')
    for (const phrase of ['one question at a time', 'partial detail', 'monorepo', 'confirm', 'templates/bootstrap', 'modify', 'npm run build', 'npm run inspect', '127.0.0.1']) {
      expect(skill.toLowerCase()).toContain(phrase.toLowerCase())
    }
  })
})
