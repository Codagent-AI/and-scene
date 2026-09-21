import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const skillRoot = join(process.cwd(), 'skills', 'presentation')
const bootstrapRoot = join(skillRoot, 'templates', 'bootstrap')
const canonicalKitRoot = join(process.cwd(), 'src', 'presentation-kit')

function filesUnder(root: string, base = root): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    return entry.isDirectory() ? filesUnder(path, base) : [relative(base, path)]
  }).sort()
}

describe('presentation skill bootstrap contract', () => {
  it('ships the skill procedure and all three scaffold anchors', () => {
    const skill = readFileSync(join(skillRoot, 'SKILL.md'), 'utf8')
    const packageJson = JSON.parse(readFileSync(join(bootstrapRoot, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
    expect(skill).toMatch(/one question at a time/i)
    expect(skill).toMatch(/relative\s+to\s+this\s+file/i)
    expect({ ...packageJson.dependencies, ...packageJson.devDependencies }).toEqual(expect.objectContaining({
      react: expect.any(String), 'react-dom': expect.any(String), motion: expect.any(String), 'lucide-react': expect.any(String),
      vite: expect.any(String), '@vitejs/plugin-react': expect.any(String), typescript: expect.any(String), playwright: expect.any(String),
      eslint: expect.any(String), '@types/react': expect.any(String), '@types/react-dom': expect.any(String), '@types/node': expect.any(String),
    }))
    expect(statSync(join(bootstrapRoot, 'vite.config.ts')).isFile()).toBe(true)
    expect(statSync(join(bootstrapRoot, 'src', 'presentation-kit', 'types.ts')).isFile()).toBe(true)
    expect(statSync(join(bootstrapRoot, 'src', 'presentations', 'index.ts')).isFile()).toBe(true)
    expect(statSync(join(bootstrapRoot, 'scripts', 'inspect-presentation.mjs')).isFile()).toBe(true)
  })

  it('keeps the bootstrap kit aligned with the canonical kit and style neutral', () => {
    const canonicalFiles = filesUnder(canonicalKitRoot).filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
    const bootstrapKitRoot = join(bootstrapRoot, 'src', 'presentation-kit')
    expect(filesUnder(bootstrapKitRoot)).toEqual(canonicalFiles)
    for (const file of canonicalFiles) {
      expect(readFileSync(join(bootstrapKitRoot, file), 'utf8')).toBe(readFileSync(join(canonicalKitRoot, file), 'utf8'))
    }
    const kitText = canonicalFiles.map((file) => readFileSync(join(bootstrapKitRoot, file), 'utf8')).join('\n')
    expect(kitText).not.toMatch(/tailwind|#[0-9a-f]{3,8}|font-family|box-shadow|border:/i)
  })
})
