/** A local namespace keeps layout identities independent of other presentations. */
export const entities = Object.fromEntries([
  'you', 'prompt', 'skill', 'conversation', 'question', 'tray', 'card-1', 'card-2',
  'card-3', 'ghost', 'depth', 'morph-1', 'morph-2', 'kit', 'verify', 'verify-link', 'modify', 'reveal',
].map(id => [id, `how-to:${id}`]))
