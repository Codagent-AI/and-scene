// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listFiles } from '../../helpers'

// Drift control for the skill's bootstrap snapshot. The canonical sources live in the repo;
// the bootstrap copies must stay byte-aligned or the skill would scaffold a different engine.
// When one of these fails, copy the canonical file into templates/bootstrap (or re-sync the
// reference-sample block of verify.mjs) and keep the sync rule in skills/presentation/README.md.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const bootstrap = join(repoRoot, 'skills', 'presentation', 'templates', 'bootstrap')

// The reference-sample block is the only part of verify.mjs allowed to differ.
const SAMPLE_BLOCK_START = '// ── Reference sample expectations'
const SAMPLE_BLOCK_END = '// ── Pure helpers'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

/** Removes the reference-sample block so the generic remainder can be compared byte for byte. */
function withoutSampleBlock(source: string): string {
  const start = source.indexOf(SAMPLE_BLOCK_START)
  const end = source.indexOf(SAMPLE_BLOCK_END)
  if (start === -1 || end === -1 || end < start) throw new Error('reference-sample block markers are missing')
  return source.slice(0, start) + source.slice(end)
}

describe('bootstrap snapshot parity', () => {
  it('mirrors every non-test scene-kit file byte for byte, with no extra or missing files', () => {
    const canonicalRoot = join(repoRoot, 'src', 'presentation-kit')
    const templateRoot = join(bootstrap, 'src', 'presentation-kit')
    const canonical = listFiles(canonicalRoot).filter((file) => !/\.test\.[tj]sx?$/.test(file))
    const template = listFiles(templateRoot).filter((file) => !/\.test\.[tj]sx?$/.test(file))

    expect(template).toEqual(canonical)
    for (const file of canonical) {
      expect(read(join(templateRoot, file)), `kit drift in ${file}`).toBe(read(join(canonicalRoot, file)))
    }
  })

  it('mirrors the inspection helper and its type declarations exactly', () => {
    for (const file of ['inspect-presentation.mjs', 'inspect-presentation.d.mts']) {
      const canonical = join(repoRoot, 'scripts', file)
      const copy = join(bootstrap, 'scripts', file)
      expect(existsSync(copy), `${file} is missing from the bootstrap`).toBe(true)
      expect(read(copy), `drift in ${file}`).toBe(read(canonical))
    }
  })

  it('mirrors the verification script outside the reference-sample block', () => {
    const canonical = read(join(repoRoot, 'scripts', 'verify.mjs'))
    const copy = read(join(bootstrap, 'scripts', 'verify.mjs'))
    expect(withoutSampleBlock(copy), 'drift in verify.mjs outside REFERENCE_SAMPLE').toBe(
      withoutSampleBlock(canonical),
    )
    expect(copy).toMatch(/export const REFERENCE_SAMPLE = null/)
  })
})
