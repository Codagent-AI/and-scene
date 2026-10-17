# Scene kit authoring reference

Import everything from `../../presentation-kit/index.ts` inside `src/presentations/<slug>/`.

## Step contract

```ts
interface Step<TPayload> {
  id: string          // stable identity
  era: string         // section label; consecutive equal eras form one table-of-contents entry
  title: string       // one line, shown in present and browse mode
  caption: string     // paragraph, shown in browse mode
  Scene: ComponentType<SceneProps<TPayload>>
  groupKey?: string   // same groupKey + same Scene => one mounted scene, only `payload` changes
  payload: TPayload   // typed state for this beat (optional when TPayload is undefined)
}
```

Step numbers come from position; never number steps by hand. `<Presentation steps={STEPS}
title="…" initialMode="browse" className="…" />` accepts a typed `Step<P>[]` without casts.

## Primitives (all style-neutral)

| Primitive | Use |
| --- | --- |
| `Box` | positioned entity; `id` is its `layoutId`; optional `icon={LucideIcon}`; `kind` names it in `data-presentation-node` |
| `Label` | free text entity |
| `SymbolChip` | small icon/text entity |
| `Frame` | outline drawn around other entities (look comes from your CSS) |
| `Arrow` | line or curve (`from`, `to`, optional `curve`, `bidirectional`, `when`); stroke follows `currentColor` |
| `Emphasis` | highlight marker that fades in/out (`active`) |
| `Appear` | `when` controls presence: newcomers enter after persisting entities settle, leavers animate out |
| `SceneLayer` | absolutely positioned layer filling the canvas |

All accept `className`/`style`. Position with `style={{ left, top, width, height }}` in canvas units
(880 × 380); the stage scales the canvas uniformly to fit. For coordinate-heavy diagrams you may use
raw `motion` elements with stable `layoutId`s.

## Motion rules

- Persisting entity: same `id` in both steps; change `left/top/width/height`, text, or a data
  attribute and it morphs in place. Do not wrap a persisting entity in `Appear` that toggles.
- Newcomer: `Appear when={beat >= n}` (enters after layout morphs finish).
- Leaver: `Appear when={beat < n}` (animates out).
- Intentional overlaps and stacks are fine; mark readable ones with `data-presentation-allow-overlap`.

## Hooks for your CSS

`[data-presentation-root]` (with `data-presentation-mode`, `-step-count`, `-step-index`),
`-header`, `-brand`, `-deck-title`, `-toc`, `-toc-item`, `-narration`, `-marker`, `-title`,
`-caption`, `-footer`, `-prev`, `-next`, `-progress`, `-progress-item`, `-attribution`,
`-stage`, `-canvas`, `-node`, `-id`. Active progress/ToC entries carry `data-presentation-active`
and `aria-current`.
