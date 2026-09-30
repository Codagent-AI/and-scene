// Shared lifecycle helpers for the scripts that boot a local vite server
// (`verify.mjs` against `vite preview`, `inspect-presentation.mjs` against the
// dev server). Both run in Node, so unlike `inspect-checks.mjs` these are
// ordinary imports.

import { setTimeout as delay } from 'node:timers/promises'

/** Polls until the server answers with anything that is not a 5xx. */
export async function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    } catch {
      // Server not ready yet.
    }
    await delay(200)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

/**
 * `npx` spawns vite as a child process, so killing only the npx process leaves
 * the real server running. Kill the whole detached process group instead.
 */
export function stopServer(child) {
  try {
    process.kill(-child.pid)
  } catch {
    child.kill()
  }
}
