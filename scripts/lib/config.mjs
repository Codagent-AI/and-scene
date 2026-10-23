import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { VerifyError } from './verify-core.mjs'

export const CONFIG_FILE = 'presentation.config.json'

/**
 * `referenceSample` is either `null` (the project explicitly has no reference
 * sample) or `{ slug, outline, stepsModule }`. A missing config or a missing
 * `referenceSample` key is an error, so the outline check can never be dropped
 * silently.
 */
export function loadConfig(root) {
  const file = path.join(root, CONFIG_FILE)
  if (!fs.existsSync(file)) throw new VerifyError('config', `${CONFIG_FILE} is missing`)
  let config
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new VerifyError('config', `${CONFIG_FILE} is not valid JSON: ${error.message}`)
  }
  if (!('referenceSample' in config)) {
    throw new VerifyError('config', `${CONFIG_FILE} must declare "referenceSample" (use null for none)`)
  }
  return config
}

export async function loadRegistry(root) {
  const file = path.join(root, 'src', 'presentations', 'index.ts')
  if (!fs.existsSync(file)) throw new VerifyError('sample-outline', 'src/presentations/index.ts is missing')
  try {
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
    return mod.presentations
  } catch (error) {
    throw new VerifyError('sample-outline', `cannot read the presentation registry: ${error.message}`)
  }
}

export async function loadActualOutline(root, reference) {
  const file = path.join(root, reference.stepsModule)
  try {
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
    return { title: mod.TITLE, steps: mod.OUTLINE }
  } catch (error) {
    throw new VerifyError('sample-outline', `cannot read sample steps from ${reference.stepsModule}: ${error.message}`)
  }
}

export function loadReferenceOutline(root, reference) {
  const file = path.join(root, reference.outline)
  if (!fs.existsSync(file)) throw new VerifyError('sample-outline', `reference outline ${reference.outline} is missing`)
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new VerifyError('sample-outline', `reference outline ${reference.outline} is malformed: ${error.message}`)
  }
}
