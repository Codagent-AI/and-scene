import { spawnSync } from 'node:child_process'

/** Runs `npm run build` in `root`; returns the exit status and the last lines of output. */
export function buildApp(root) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n')
  // A launch failure or timeout leaves no output; report why instead.
  const output = text || String(result.error?.message ?? result.signal ?? '')
  return { status: result.status, output }
}
