#!/usr/bin/env node
// Deterministic build + browser-render verification for a scaffolded
// presentation app. Fails the process (non-zero exit) on any build error,
// console error, uncaught page error, or failed step transition.
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { CANONICAL_SAMPLE_SLUG, validateCanonicalSteps } from './validate-canonical-steps.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const HOST = '127.0.0.1'
const PORT = 4173

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`\nfailed: ${command} ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`server at ${url} did not become ready within ${timeoutMs}ms`)
}

/** Opens one SSR server for the duration of `fn`, closing it either way. */
async function withSsrServer(fn) {
  const server = await createServer({ root, server: { middlewareMode: true } })
  try {
    return await fn(server)
  } finally {
    await server.close()
  }
}

async function loadRegistry(server) {
  const module = await server.ssrLoadModule('/src/presentations/index.ts')
  return module.presentations ?? []
}

/**
 * Asserts that the committed reference sample is registered at
 * `CANONICAL_SAMPLE_SLUG` and implements exactly the nine canonical steps,
 * in order, with the exact normative titles/captions/sections. Reads the
 * ordered step metadata straight from the presentation's own `steps` module
 * (its real `STEPS` export) rather than duplicating a second step list.
 */
async function assertCanonicalSample(server, presentations) {
  const entry = presentations.find((candidate) => candidate.slug === CANONICAL_SAMPLE_SLUG)
  if (!entry) {
    throw new Error(
      `canonical reference sample missing: no presentation registered with slug "${CANONICAL_SAMPLE_SLUG}"`,
    )
  }

  const stepsModule = await server.ssrLoadModule(`/src/presentations/${CANONICAL_SAMPLE_SLUG}/steps/index.ts`)
  const steps = stepsModule.STEPS

  const result = validateCanonicalSteps(steps)
  if (!result.ok) {
    throw new Error(`canonical reference sample does not match the required nine-step outline: ${result.message}`)
  }
}

async function verifyPresentation(baseUrl, slug) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })

  await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })

  const root = page.locator('[data-scene-kit="presentation"]')
  await root.waitFor({ state: 'attached', timeout: 10000 })

  const stepCount = Number(await root.getAttribute('data-step-count'))
  if (!Number.isFinite(stepCount) || stepCount < 1) {
    throw new Error(`presentation "${slug}" exposes an invalid data-step-count`)
  }

  for (let expected = 0; expected < stepCount; expected += 1) {
    const index = Number(await root.getAttribute('data-step-index'))
    if (index !== expected) {
      throw new Error(`presentation "${slug}" failed to advance: expected step ${expected}, saw ${index}`)
    }
    if (expected < stepCount - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(150)
    }
  }

  await browser.close()

  if (errors.length > 0) {
    throw new Error(`presentation "${slug}" raised errors:\n${errors.join('\n')}`)
  }
}

async function main() {
  run('npm', ['run', 'build'])

  const presentations = await withSsrServer(async (server) => {
    const registry = await loadRegistry(server)
    await assertCanonicalSample(server, registry)
    return registry
  })
  console.log('canonical reference sample matches the required nine-step outline')

  if (presentations.length === 0) {
    console.log('\nno presentations registered — build verified, skipping render check')
    return
  }

  const preview = spawn('npx', ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: root,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  })

  const baseUrl = `http://${HOST}:${PORT}`

  try {
    await waitForServer(baseUrl)
    for (const entry of presentations) {
      console.log(`\nrendering "${entry.slug}"...`)
      await verifyPresentation(baseUrl, entry.slug)
      console.log(`"${entry.slug}" rendered all steps with no errors`)
    }
  } finally {
    preview.kill()
  }

  console.log('\nverify passed')
}

main().catch((error) => {
  console.error(`\nverify failed: ${error.message}`)
  process.exit(1)
})
