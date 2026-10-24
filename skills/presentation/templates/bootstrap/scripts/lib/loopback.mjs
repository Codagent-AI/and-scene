import net from 'node:net'

/** The one address used for the preview host, readiness probe, and browser URLs. */
export const LOOPBACK_HOST = '127.0.0.1'

export const originOf = (port) => `http://${LOOPBACK_HOST}:${port}`

export const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, LOOPBACK_HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Poll until the URL answers, or throw after `timeoutMs`. */
export async function waitForReady(url, { fetchFn = fetch, timeoutMs = 30_000, intervalMs = 200, sleep = defaultSleep } = {}) {
  const deadline = Date.now() + timeoutMs
  let last = 'no response'
  while (Date.now() < deadline) {
    try {
      const res = await fetchFn(url)
      if (res.ok) return
      last = `HTTP ${res.status}`
    } catch (err) {
      last = err instanceof Error ? err.message : String(err)
    }
    await sleep(intervalMs)
  }
  throw new Error(`${url} was not ready after ${timeoutMs}ms (${last})`)
}
