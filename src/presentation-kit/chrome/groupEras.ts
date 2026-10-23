export interface Entry {
  era: string
  first: number
  last: number
}

/** Consecutive steps that share an era label form one entry. */
export function groupEras(eras: readonly string[]): Entry[] {
  const entries: Entry[] = []
  eras.forEach((era, i) => {
    const tail = entries[entries.length - 1]
    if (tail && tail.era === era) tail.last = i
    else entries.push({ era, first: i, last: i })
  })
  return entries
}
