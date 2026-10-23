import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..', '..')
const TEMPLATE = join(ROOT, 'skills', 'presentation', 'templates', 'presentation')

const work = mkdtempSync(join(tmpdir(), 'presentation-template-'))
afterAll(() => {
  rmSync(work, { recursive: true, force: true })
})

/**
 * The skill copies the template into src/presentations/<slug>/. This lays out a copy the same way,
 * next to the real kit and dependencies, and type-checks it, so the template cannot ship broken.
 */
describe('presentation template', () => {
  it('type-checks as shipped, when copied into a presentation folder beside the kit', () => {
    const src = join(work, 'src')
    cpSync(TEMPLATE, join(src, 'presentations', 'example'), { recursive: true })
    symlinkSync(join(ROOT, 'src', 'presentation-kit'), join(src, 'presentation-kit'), 'dir')
    symlinkSync(join(ROOT, 'node_modules'), join(work, 'node_modules'), 'dir')
    mkdirSync(join(work, 'src'), { recursive: true })
    writeFileSync(
      join(work, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'es2023',
          lib: ['ES2023', 'DOM'],
          module: 'esnext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: ['vite/client'],
          verbatimModuleSyntax: true,
          allowImportingTsExtensions: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
        },
        include: ['src'],
      }),
    )
    const tsc = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
    // Like the app's tsconfig, the Vite client types supply declarations for side-effect CSS imports.
    const output = execFileSync(process.execPath, [tsc, '-p', join(work, 'tsconfig.json')], { encoding: 'utf8' }).trim()
    expect(output).toBe('')
  }, 120_000)
})
