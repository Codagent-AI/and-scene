import { spawnSync } from 'node:child_process'

/** Runs `npm run build` in `root`; returns the exit status and the last lines of output. */
export function buildApp(root) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8' })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n')
  return { status: result.status, output }
}
