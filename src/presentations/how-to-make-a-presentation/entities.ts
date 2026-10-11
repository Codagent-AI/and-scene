/** Keep identifiers stable for visual entities that continue between steps. */
export const entity = (name: string) => `talk:${name}`

/** Step cards in the tray are numbered; every other entity is named once in the scene. */
export const cardEntity = (n: number) => entity(`card-${n}`)
