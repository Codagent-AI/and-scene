// Component identity belongs in the transition key as well as the scene group.
// Weak keys avoid retaining presentation modules after they are unloaded.
const identities = new WeakMap<object, number>()
let sequence = 0
export function sceneIdentity(component: object) {
  if (!identities.has(component)) identities.set(component, sequence++)
  return identities.get(component)!
}
