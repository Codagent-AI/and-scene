// Which repository files are mirrored byte-for-byte into the bootstrap template.
export const SYNCED_FILES = [
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'public/favicon.svg',
  'src/index.css',
  'src/main.tsx',
  'src/App.tsx',
  'src/Landing.tsx',
  'src/route.ts',
]

export const SYNCED_SCRIPTS = [
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/inspection-checks.mjs',
  'scripts/preview.mjs',
]

/** Kit sources are mirrored; the kit's own tests are not. */
export const isKitSource = (rel) => !/\.test\.tsx?$/.test(rel)
