// Starter-specific data for the verifier. This is the one deliberate difference between the
// root and the bootstrap template copies of scripts/: the reference is the starter presentation
// instead of the sample. Keep the rest of scripts/ byte-identical to the root copies.
export const REFERENCE = {
  slug: 'starter',
  steps: [
    ['the start', 'A first idea', 'The presentation opens on one idea.'],
    ['the middle', 'It develops', 'The same scene grows: the idea connects to the next one.'],
    ['the end', 'It lands', 'The last piece completes the chain without moving what came before.'],
  ].map(([era, title, caption]) => ({ era, title, caption })),
}
