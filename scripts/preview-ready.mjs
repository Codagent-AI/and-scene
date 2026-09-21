/**
 * Waits for a preview server to serve `url`.
 *
 * Readiness is probed over HTTP rather than by scraping the server's log, because
 * vite colorizes its banner and the ANSI escapes split `host:port` apart.
 */
export async function waitForPreview({ url, isAlive = () => true, timeoutMs = 30_000, intervalMs = 100 }) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!isAlive()) return { ready: false, reason: 'preview exited early' }
    try {
      const response = await fetch(url)
      // Release the socket back to the pool; an undrained body holds it open.
      await response.body?.cancel()
      if (response.ok) return { ready: true }
    } catch { /* wait for the server socket */ }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return { ready: false, reason: 'preview did not become ready' }
}
