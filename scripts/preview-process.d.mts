import type { ChildProcessWithoutNullStreams } from 'node:child_process'

export function startPreview(
  vite: string,
  cwd: string,
  spawnProcess?: typeof import('node:child_process').spawn,
): { child: ChildProcessWithoutNullStreams; ready: Promise<{ child: ChildProcessWithoutNullStreams; url: string }> }
