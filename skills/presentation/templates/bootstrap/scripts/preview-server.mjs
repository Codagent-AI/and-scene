import { preview } from 'vite'

/** Start Vite directly; this promise rejects if this invocation cannot bind. */
export function startOwnedPreview({ host, port }) {
  return preview({ preview: { host, port, strictPort: true } })
}

/** Poll the already-owned preview with a deadline per HTTP request. */
export async function waitForPreviewResponse(url, {
  attempts = 40,
  delayMs = 250,
  fetchImpl = fetch,
  requestTimeoutMs = 250,
} = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(requestTimeoutMs) })
      if (response.ok) return
    } catch {
      // A timed-out or refused request is expected while Vite starts.
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error(`owned preview did not become ready at ${url}.`)
}
