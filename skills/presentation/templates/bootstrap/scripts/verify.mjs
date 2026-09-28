#!/usr/bin/env node
/**
 * Generic deterministic build + browser-render verification for a
 * presentation-app bootstrapped from the `presentation` skill.
 *
 * Unlike the polished, project-specific verification script this template's
 * host repository may eventually add for a canonical sample, this script
 * makes NO assumption about which presentations are registered, their
 * titles, or their step counts. It only assumes the presentation-kit
 * contract: `[data-presentation-root]` exposing `data-step-count` and
 * `data-step-index`, and that ArrowRight advances the active step by
 * exactly one with no wrap-around past the last step.
 *
 * Phases (any failure exits non-zero and names the phase):
 *   1. build   - `npm run build` (tsc -b && vite build)
 *   2. registry - src/presentations/index.ts must declare at least one slug
 *   3. render  - `vite preview` on 127.0.0.1, then Playwright Chromium opens
 *                every registered route and steps through it end to end
 */
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const isWindows = process.platform === 'win32'

function fail(phase, message) {
  console.error(`\n[verify] FAILED (${phase}): ${message}\n`)
  process.exit(1)
}

function runBuild() {
  console.log('[verify] build: running `npm run build` (tsc -b && vite build)...')
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: isWindows,
  })
  if (result.status !== 0) {
    fail('build', 'tsc/vite build reported errors (see output above)')
  }
  console.log('[verify] build: OK')
}

function readRegisteredSlugs() {
  const registryPath = path.join(ROOT, 'src', 'presentations', 'index.ts')
  let source
  try {
    source = readFileSync(registryPath, 'utf8')
  } catch {
    fail('registry', `could not read ${registryPath}`)
  }
  const slugPattern = /slug:\s*['"]([^'"]+)['"]/g
  const slugs = []
  let match
  while ((match = slugPattern.exec(source)) !== null) {
    slugs.push(match[1])
  }
  if (slugs.length === 0) {
    fail(
      'registry',
      'src/presentations/index.ts has zero registered presentations - nothing to render-check. ' +
        'Register at least one presentation before running verify.',
    )
  }
  console.log(`[verify] registry: found ${slugs.length} presentation(s): ${slugs.join(', ')}`)
  return slugs
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close(() => (port ? resolve(port) : reject(new Error('could not allocate a free port'))))
    })
  })
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return
    } catch {
      // Not up yet; retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`preview server at ${url} did not become ready within ${timeoutMs}ms`)
}

/** Kills a spawned process and waits for it to actually exit, so the port is released before this script exits. */
function terminate(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve()
      return
    }
    child.once('exit', () => resolve())
    child.kill()
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    }, 3000).unref()
  })
}

async function checkSlug(browser, baseUrl, slug) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`)
  })

  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ state: 'attached', timeout: 10000 })

    const stepCount = Number(await root.getAttribute('data-step-count'))
    if (!Number.isFinite(stepCount) || stepCount < 1) {
      return { ok: false, reason: `invalid data-step-count on route /${slug}` }
    }

    const initialIndex = Number(await root.getAttribute('data-step-index'))
    if (initialIndex !== 0) {
      return {
        ok: false,
        reason: `expected initial data-step-index=0 on /${slug}, got ${initialIndex}`,
        stepIndex: initialIndex,
      }
    }

    for (let expected = 1; expected < stepCount; expected += 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(150)
      const next = Number(await root.getAttribute('data-step-index'))
      if (next !== expected) {
        return {
          ok: false,
          reason: `step transition did not advance by one: expected data-step-index=${expected}, got ${next}`,
          stepIndex: expected,
        }
      }
    }

    // One more press past the last step must not wrap or overshoot.
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(150)
    const afterLast = Number(await root.getAttribute('data-step-index'))
    if (afterLast !== stepCount - 1) {
      return {
        ok: false,
        reason: `navigation past the last step should clamp at ${stepCount - 1}, got ${afterLast}`,
        stepIndex: afterLast,
      }
    }

    if (errors.length > 0) {
      return { ok: false, reason: errors.join('; '), stepIndex: afterLast }
    }

    return { ok: true, stepCount }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  } finally {
    await page.close()
  }
}

async function main() {
  runBuild()
  const slugs = readRegisteredSlugs()

  const port = await getFreePort()
  const host = '127.0.0.1'
  const baseUrl = `http://${host}:${port}`

  console.log(`[verify] render: starting \`vite preview\` on ${baseUrl} ...`)
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const preview = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  let previewOutput = ''
  preview.stdout?.on('data', (chunk) => {
    previewOutput += chunk.toString()
  })
  preview.stderr?.on('data', (chunk) => {
    previewOutput += chunk.toString()
  })

  let failures = []
  try {
    await waitForServer(baseUrl)

    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    try {
      for (const slug of slugs) {
        const result = await checkSlug(browser, baseUrl, slug)
        if (result.ok) {
          console.log(`[verify] render: OK "${slug}" (${result.stepCount} steps, no console/page errors)`)
        } else {
          const at = result.stepIndex !== undefined ? ` at step ${result.stepIndex}` : ''
          console.error(`[verify] render: FAILED "${slug}"${at}: ${result.reason}`)
          failures.push({ slug, ...result })
        }
      }
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.error(`[verify] render: unexpected failure: ${err instanceof Error ? err.message : String(err)}`)
    console.error(previewOutput)
    failures.push({ slug: '(preview startup)', reason: String(err) })
  } finally {
    await terminate(preview)
  }

  if (failures.length > 0) {
    fail(
      'render',
      `${failures.length} presentation(s) failed: ${failures.map((f) => f.slug).join(', ')}`,
    )
  }

  console.log('\n[verify] All checks passed (build, registry, render).\n')
  process.exit(0)
}

main().catch((err) => {
  console.error(`[verify] unexpected error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`)
  process.exit(1)
})
