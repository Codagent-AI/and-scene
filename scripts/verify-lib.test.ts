import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  REFERENCE_SLUG,
  REFERENCE_TITLE,
  checkPresentationsArray,
  isSampleRegistered,
  readRegistrySource,
} from './verify-lib.mjs'

const ROOT = join(import.meta.dirname, '..')
const REGISTRY_PATH = join(ROOT, 'src/presentations/index.ts')

describe('reference sample registration', () => {
  it('Scenario: Sample exists and matches the outline — registry includes the reference slug', async () => {
    expect(await isSampleRegistered(ROOT)).toBe(true)
    expect(checkPresentationsArray(readRegistrySource(REGISTRY_PATH))).toBe(true)
  })

  it('Scenario: Missing sample fails — absent slug is detected', () => {
    const source = readRegistrySource(REGISTRY_PATH)
    const withoutSlug = source.replace(`slug: '${REFERENCE_SLUG}'`, "slug: 'missing-slug'")
    expect(checkPresentationsArray(withoutSlug)).toBe(false)
  })

  it('registry entry uses the normative presentation title', () => {
    const source = readRegistrySource(REGISTRY_PATH)
    expect(source).toContain(REFERENCE_TITLE)
  })
})
