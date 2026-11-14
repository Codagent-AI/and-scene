import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL as NodeURL } from 'node:url'
import { resolve } from 'node:path'
export const SAMPLE_SLUG = 'how-to-make-a-presentation'
export async function canonicalOutline() { return JSON.parse(await readFile(new NodeURL('./reference.json', import.meta.url), 'utf8')) }
export function validateOutline(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== 9) throw new Error('sample: expected nine steps')
  for (let i = 0; i < expected.length; i++) {
    for (const key of ['era', 'title', 'caption']) if (actual[i]?.[key] !== expected[i][key]) throw new Error(`sample step ${i}: incorrect ${key}`)
  }
}
export async function checkReference(cwd) {
  const expected = await canonicalOutline()
  try {
    const registry = await readFile(resolve(cwd, 'src/presentations/index.ts'), 'utf8')
    if (!registry.includes(`slug: '${SAMPLE_SLUG}'`) && !registry.includes(`slug: "${SAMPLE_SLUG}"`)) throw new Error('sample is not registered')
    const outline = JSON.parse(await readFile(resolve(cwd, `src/presentations/${SAMPLE_SLUG}/steps/outline.json`), 'utf8'))
    validateOutline(outline, expected)
  } catch (error) { throw new Error(`sample: ${error.message}`, { cause: error }) }
  return expected
}
export const projectRoot = fileURLToPath(new NodeURL('../', import.meta.url))
