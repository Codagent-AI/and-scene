// Shared preview-server startup for the verification and inspection scripts.
//
// Both scripts previously ran `spawn('npx', ['vite', 'preview', ...])` and shut
// it down with `child.kill()`. That killed only the `npx` wrapper: the real
// `vite preview` was reparented to init and kept holding the port. The next run
// then failed its own `--strictPort` bind — an error nothing checked, because
// the child had no 'error'/'exit' handler — and the readiness probe happily
// connected to the *stale* server, so verification ran against a bundle from a
// different tree and could report a false pass or a false fail.
//
// Vite's programmatic preview server removes the whole class of bug: there is no
// child process to orphan, a port conflict rejects instead of being swallowed,
// and `close()` actually releases the port.
import { preview } from 'vite'

/**
 * Starts a preview server for the already-built `dist/` and returns it.
 * Rejects if `port` is already held, rather than silently reusing whatever is
 * listening there. Call `close()` on the result to release the port.
 */
export async function startPreviewServer({ root, host, port }) {
  const server = await preview({
    root,
    // `logLevel: 'warn'` keeps the scripts' own output readable while still
    // surfacing real problems.
    logLevel: 'warn',
    preview: { host, port, strictPort: true },
  })
  return server
}
