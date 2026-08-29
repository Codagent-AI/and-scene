import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { expect, test } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '../..')
const bootstrapRoot = resolve(import.meta.dirname, 'templates/bootstrap')
const templateKitRoot = resolve(bootstrapRoot, 'src/presentation-kit')

function listFiles(root: string): string[] {
  return readFileSync(resolve(root, '.template-files'), 'utf8')
    .trim()
    .split('\n')
    .filter((file) => file && file !== '.template-files')
}

test('INT-001 materializes a buildable, style-neutral bootstrap independently of the caller directory', () => {
  const materializedRoot = mkdtempSync(resolve(tmpdir(), 'and-scene-bootstrap-'))

  try {
    cpSync(bootstrapRoot, materializedRoot, { recursive: true })

    expect(existsSync(resolve(materializedRoot, 'package.json'))).toBe(true)
    expect(existsSync(resolve(materializedRoot, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(resolve(materializedRoot, 'src/presentations/index.ts'))).toBe(true)
    expect(existsSync(resolve(materializedRoot, 'scripts/verify.mjs'))).toBe(true)
    expect(existsSync(resolve(materializedRoot, 'scripts/inspect-presentation.mjs'))).toBe(true)
    expect(existsSync(resolve(materializedRoot, 'package-lock.json'))).toBe(true)

    const packageJson = JSON.parse(readFileSync(resolve(materializedRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) {
      expect(packageJson.dependencies[dependency]).toBeTruthy()
    }
    for (const dependency of [
      'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom',
      '@types/node', 'eslint', 'playwright',
    ]) {
      expect(packageJson.devDependencies[dependency]).toBeTruthy()
    }

    expect(JSON.stringify(packageJson)).not.toContain('tailwind')
    const kitSource = readFileSync(resolve(materializedRoot, 'src/presentation-kit/Presentation.tsx'), 'utf8')
    expect(kitSource).not.toMatch(/color:|font|border|boxShadow|background:/)

    for (const file of listFiles(templateKitRoot)) {
      expect(readFileSync(resolve(templateKitRoot, file), 'utf8')).toBe(
        readFileSync(resolve(repositoryRoot, 'src/presentation-kit', file), 'utf8'),
      )
    }

    execFileSync('npm', ['ci', '--ignore-scripts'], { cwd: materializedRoot, stdio: 'pipe' })
    execFileSync('npm', ['run', 'build'], { cwd: materializedRoot, stdio: 'pipe' })
  } finally {
    rmSync(materializedRoot, { force: true, recursive: true })
  }
})
