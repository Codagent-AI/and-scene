import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

function materializePresentation(root: string) {
  const destination = resolve(root, 'src/presentations/generated-deck')
  const values: Record<string, string> = {
    '{{slug}}': 'generated-deck',
    '{{title}}': 'Generated deck',
    '{{StepComponent}}': 'firstStep',
    '{{StepFile}}': 'FirstStep',
    '{{stepId}}': 'first',
    '{{era}}': 'start',
    '{{caption}}': 'A generated caption.',
    '{{visualLabel}}': 'Generated node',
  }
  const replace = (source: string) => Object.entries(values).reduce(
    (result, [placeholder, value]) => result.replaceAll(placeholder, value), source,
  )
  const write = (source: string, destinationFile: string) => {
    writeFileSync(resolve(destination, destinationFile), replace(readFileSync(resolve(import.meta.dirname, source), 'utf8')))
  }

  mkdirSync(resolve(destination, 'steps'), { recursive: true })
  write('templates/presentation/Talk.tsx.template', 'Talk.tsx')
  write('templates/presentation/entities.ts.template', 'entities.ts')
  write('templates/presentation/presentation.css.template', 'presentation.css')
  write('templates/presentation/steps/index.ts.template', 'steps/index.ts')
  write('templates/presentation/steps/Step.tsx.template', 'steps/FirstStep.tsx')
  writeFileSync(resolve(root, 'src/presentations/index.ts'), `
import type { ComponentType } from 'react'
export interface PresentationRegistration { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly PresentationRegistration[] = [
  { slug: 'generated-deck', title: 'Generated deck', load: () => import('./generated-deck/Talk') },
]
`)
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

    materializePresentation(materializedRoot)
    execFileSync('npm', ['ci', '--ignore-scripts'], { cwd: materializedRoot, stdio: 'pipe' })
    execFileSync('npm', ['run', 'build'], { cwd: materializedRoot, stdio: 'pipe' })

    const talk = readFileSync(resolve(materializedRoot, 'src/presentations/generated-deck/Talk.tsx'), 'utf8')
    expect(talk).toContain('className="generated-deck-presentation"')
    expect(talk).not.toContain('type Step')
    expect(readFileSync(resolve(bootstrapRoot, 'scripts/verify.mjs'), 'utf8')).toContain('getAvailablePort')
    expect(readFileSync(resolve(bootstrapRoot, 'scripts/inspect-presentation.mjs'), 'utf8')).toContain(
      "if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid data-step-count.')",
    )
    const inspector = readFileSync(resolve(bootstrapRoot, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(inspector).toContain("document.querySelectorAll('[data-presentation] *')")
    expect(inspector).toContain('element.children.length === 0')
    expect(inspector).toContain("closest('[data-presentation-allow-overlap]')")
  } finally {
    rmSync(materializedRoot, { force: true, recursive: true })
  }
})
