/** Run every cleanup even if earlier ones reject; failures are logged, never thrown over the real error. */
export async function runCleanups(cleanups, log = console.error) {
  for (const cleanup of cleanups) {
    try {
      await cleanup()
    } catch (err) {
      log(`cleanup failed: ${err instanceof Error ? err.message : err}`)
    }
  }
}
