import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  REFERENCE_SLUG,
  REFERENCE_TITLE,
  checkSampleRegistered,
  readRegistrySource,
} from './verify-lib.mjs'

const ROOT = join(import.meta.dirname, '..')
const REGISTRY_PATH = join(ROOT, 'src/presentations/index.ts')

describe('reference sample registration', () => {
  it('Scenario: Sample exists and matches the outline — registry includes the reference slug', () => {
    const source = readRegistrySource(REGISTRY_PATH)
    expect(checkSampleRegistered(source)).toBe(true)
  })

  it('Scenario: Missing sample fails — absent slug is detected', () => {
    const source = readFileSync(REGISTRY_PATH, 'utf-8').replaceAll(REFERENCE_SLUG, 'missing-slug')
    expect(checkSampleRegistered(source)).toBe(false)
  })

  it('registry entry uses the normative presentation title', () => {
    const source = readRegistrySource(REGISTRY_PATH)
    expect(source).toContain(REFERENCE_TITLE)
  })
})
