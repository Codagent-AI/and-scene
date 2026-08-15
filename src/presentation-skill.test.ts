import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const skill = (path: string) => join(root, 'skills', 'presentation', path)

test('ships a self-contained, style-neutral presentation bootstrap and authoring templates', () => {
  const requiredFiles = [
    'SKILL.md',
    'templates/presentation/Talk.tsx',
    'templates/presentation/entities.ts',
    'templates/presentation/steps/first.tsx',
    'templates/presentation/presentation.css',
    'templates/bootstrap/package.json',
    'templates/bootstrap/index.html',
    'templates/bootstrap/src/main.tsx',
    'templates/bootstrap/src/presentation-kit/Presentation.tsx',
    'templates/bootstrap/src/presentations/index.ts',
    'templates/bootstrap/scripts/verify.mjs',
    'templates/bootstrap/scripts/inspect-presentation.mjs',
    'templates/bootstrap/scripts/visual-warnings.mjs',
  ]

  for (const file of requiredFiles) expect(existsSync(skill(file))).toBe(true)

  const procedure = readFileSync(skill('SKILL.md'), 'utf8')
  expect(procedure).toContain('one question at a time')
  expect(procedure).toContain('partial detail')
  expect(procedure).toContain('templates/bootstrap')
  expect(procedure).toContain('relative to this SKILL.md')
  expect(procedure).toContain('pnpm-workspace.yaml')
  expect(procedure).toContain('presentations/')
  expect(procedure).toContain('npm run build')
  expect(procedure).toContain('npm run verify')
  expect(procedure).toContain('inspect-presentation')
  expect(procedure).toContain('## Out of scope')
  expect(procedure).toContain('Remaining failures:')
  expect(procedure).toContain("target's `Talk.tsx`, `entities.ts`")

  const talkTemplate = readFileSync(skill('templates/presentation/Talk.tsx'), 'utf8')
  const stepTemplate = readFileSync(skill('templates/presentation/steps/first.tsx'), 'utf8')
  expect(talkTemplate).toContain("from './steps/first'")
  expect(stepTemplate).toContain("from '../entities'")
  expect(stepTemplate).toContain("from '../../../presentation-kit'")

  const bootstrapPackage = JSON.parse(readFileSync(skill('templates/bootstrap/package.json'), 'utf8')) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    scripts: Record<string, string>
  }
  expect(bootstrapPackage.dependencies).toMatchObject({
    react: expect.any(String),
    'react-dom': expect.any(String),
    motion: expect.any(String),
    'lucide-react': expect.any(String),
  })
  expect(bootstrapPackage.devDependencies).toMatchObject({
    vite: expect.any(String),
    typescript: expect.any(String),
    playwright: expect.any(String),
  })
  expect(bootstrapPackage.scripts).toMatchObject({ build: expect.any(String), verify: expect.any(String), inspect: expect.any(String) })

  expect(readFileSync(skill('templates/bootstrap/tsconfig.app.json'), 'utf8')).toContain('vite/client')

  const kit = readFileSync(skill('templates/bootstrap/src/presentation-kit/Presentation.tsx'), 'utf8')
  expect(kit).toContain('data-step-count')
  expect(kit).toContain('data-step-index')
  expect(kit).not.toMatch(/#[0-9a-f]{3,8}|font-family|box-shadow|border\s*:/i)

  const bootstrapVerify = readFileSync(skill('templates/bootstrap/scripts/verify.mjs'), 'utf8')
  const bootstrapInspect = readFileSync(skill('templates/bootstrap/scripts/inspect-presentation.mjs'), 'utf8')
  expect(bootstrapVerify).toContain('inferSolePresentationSlug')
  expect(bootstrapInspect).toContain('let browser')
  expect(bootstrapInspect).toContain('await browser?.close()')
  expect(readFileSync(skill('templates/bootstrap/scripts/visual-warnings.mjs'), 'utf8')).toContain('data-presentation-allow-overlap')
})

test('keeps the distributable scene kit byte-aligned with canonical runtime files', () => {
  const canonical = join(root, 'src', 'presentation-kit')
  const snapshot = skill('templates/bootstrap/src/presentation-kit')
  const runtimeFiles = (directory: string, prefix = ''): string[] => readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = join(prefix, entry.name)
      if (entry.isDirectory()) return runtimeFiles(join(directory, entry.name), relative)
      return entry.name.includes('.test.') ? [] : [relative]
    })
    .sort()

  expect(runtimeFiles(snapshot)).toEqual(runtimeFiles(canonical))
  for (const file of runtimeFiles(canonical)) {
    expect(readFileSync(join(snapshot, file), 'utf8')).toBe(readFileSync(join(canonical, file), 'utf8'))
  }
})
