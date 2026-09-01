import { preview } from 'vite'

/** Start Vite directly; this promise rejects if this invocation cannot bind. */
export function startOwnedPreview({ host, port }) {
  return preview({ preview: { host, port, strictPort: true } })
}

/** Poll the already-owned preview with a deadline per HTTP request. */
export function waitForPreviewResponse(url, {
  attempts = 40,
  delayMs = 250,
  fetchImpl = fetch,
  requestTimeoutMs = 250,
} = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      callback(value)
    }

    const poll = async () => {
      for (let attempt = 0; attempt < attempts && !settled; attempt += 1) {
        try {
          const response = await fetchImpl(url, { signal: AbortSignal.timeout(requestTimeoutMs) })
          if (response.ok) return finish(resolve)
        } catch {
          // A timed-out or refused request is expected while Vite starts.
        }
        if (!settled) await new Promise((resume) => setTimeout(resume, delayMs))
      }
      finish(reject, new Error(`owned preview did not become ready at ${url}.`))
    }
    void poll()
  })
}
