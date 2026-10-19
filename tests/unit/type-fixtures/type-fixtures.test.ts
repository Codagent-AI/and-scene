import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

// Type contracts for the scene kit: fixtures are compiled with tsc in a separate project so
// intentionally failing ones never reach the application build (tsconfig.node excludes this folder).
const ROOT = process.cwd()
const FIXTURE_TSCONFIG = 'tests/unit/type-fixtures/tsconfig.json'
const KIT_FIXTURE_DIR = resolve(ROOT, 'src/presentation-kit/__fixtures__')

interface Diagnostic {
  file: string
  code: string
  message: string
}

interface TscRun {
  exitCode: number
  diagnostics: Diagnostic[]
}

const DIAGNOSTIC = /^(.+?)\(\d+,\d+\): error (TS\d+): (.*)$/

function runTsc(): Promise<TscRun> {
  return new Promise((resolve, reject) => {
    execFile(
      'npx',
      ['tsc', '--noEmit', '-p', FIXTURE_TSCONFIG, '--pretty', 'false'],
      { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout) => {
        if (error && typeof error.code !== 'number') {
          reject(error)
          return
        }
        const diagnostics: Diagnostic[] = []
        for (const line of stdout.split('\n')) {
          const match = DIAGNOSTIC.exec(line)
          if (match) diagnostics.push({ file: match[1], code: match[2], message: match[3] })
        }
        resolve({ exitCode: error ? (error.code as number) : 0, diagnostics })
      },
    )
  })
}

/** Diagnostics for a fixture file name (relative to the fixture folder or the kit fixtures folder). */
function diagnosticsFor(run: TscRun, name: string): Diagnostic[] {
  return run.diagnostics.filter((d) => d.file.endsWith(name))
}

describe('scene kit type fixtures', () => {
  let run: TscRun

  beforeAll(async () => {
    run = await runTsc()
  }, 180_000)

  it('fails type-checking overall, because the intentionally incompatible fixtures are present', () => {
    expect(run.exitCode).not.toBe(0)
  })

  it.each([
    ['missing-id.tsx', 'id'],
    ['missing-era.tsx', 'era'],
    ['missing-title.tsx', 'title'],
    ['missing-caption.tsx', 'caption'],
    ['missing-payload.tsx', 'payload'],
    ['missing-scene.tsx', 'Scene'],
  ])('a Step omitting %s fails with TS2741 naming the field', (file, field) => {
    const found = diagnosticsFor(run, file)
    expect(found).toHaveLength(1)
    expect(found[0].code).toBe('TS2741')
    expect(found[0].message).toContain(`Property '${field}' is missing`)
  })

  it('rejects a Step whose id is not a string (TS2322)', () => {
    const found = diagnosticsFor(run, 'invalid-id-type.tsx')
    expect(found).toHaveLength(1)
    expect(found[0].code).toBe('TS2322')
    expect(found[0].message).toContain("Type 'number' is not assignable to type 'string'")
  })

  it('rejects a grouped step whose payload does not match its Scene props (TS2353)', () => {
    const found = diagnosticsFor(run, 'incompatible-payload.tsx')
    expect(found).toHaveLength(1)
    expect(found[0].code).toBe('TS2353')
    expect(found[0].message).toContain("'label' does not exist in type 'BoardPayload'")
  })

  it.each([
    'valid-step.tsx',
    'valid-grouped-payload.tsx',
    'box-with-icon.tsx',
  ])('kit fixture %s type-checks with no diagnostics', (file) => {
    expect(diagnosticsFor(run, file)).toEqual([])
  })

  it('keeps the typed grouped fixture free of casts, any, and suppression directives', () => {
    const source = readFileSync(resolve(KIT_FIXTURE_DIR, 'valid-grouped-payload.tsx'), 'utf8')
    expect(source).not.toMatch(/\bas\s+[A-Za-z{[]/)
    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toMatch(/@ts-/)
  })
})
