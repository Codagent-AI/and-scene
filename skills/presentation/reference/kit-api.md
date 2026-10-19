# Scene kit API (`src/presentation-kit/`)

Import everything from the kit entry point: `import { ... } from '../../presentation-kit'` (relative to
`src/presentations/<slug>/`, or `'../../../presentation-kit'` from `steps/`). The kit is style-neutral:
it owns behavior, geometry and `data-presentation-*` hooks only. Do not edit it per presentation.

## Step contract

```ts
interface SceneProps<TPayload = undefined> { payload: TPayload; stepIndex: number }

type Step<TPayload = undefined> = {
  id: string          // stable identity, never derived from position
  era: string         // section label; contiguous steps with the same era form one ToC entry
  title: string       // one-line presenter title
  caption: string     // paragraph shown in browse mode
  Scene: ComponentType<SceneProps<TPayload>>
  groupKey?: string   // steps sharing groupKey AND the same Scene keep one mounted instance
  payload?: TPayload  // required when TPayload is not undefined; typed through <Presentation>
}
```

Steps in a group are not remounted: only `payload`/`stepIndex` change, so entities update in place and
morph. Different groups cross-fade. Use a typed payload (for example the list of visible entities) or just
`stepIndex` to decide what a step shows.

## Presentation

```tsx
<Presentation steps={STEPS} title="Talk title" initialMode="browse" brand={...} attribution />
```
- `steps: Step<TPayload>[]`, `title`, `initialMode?: 'browse' | 'present'` (default `browse`).
- `brand?: ReactNode` fills the top-left header slot (hosts opt in).
- `attribution?: boolean` (default true) renders the bottom-right `made by and-scene` link.
- Navigation: ArrowRight / Space / PageDown next, ArrowLeft / PageUp previous, `P` toggles mode, horizontal
  swipe; clamps at first and last step; keys are ignored while a button, link or input has focus.
- Browse mode: title, multi-line caption, ToC on wide viewports (>= 1024px), progress dots, prev/next.
  Present mode: marker and one-line title only.

## Canvas and primitives

The scene is drawn on a fixed **880 x 380** design canvas (`DESIGN_W`, `DESIGN_H`) that the kit scales
uniformly to fit. Position everything with canvas coordinates inside `<SceneLayer>`.

| Primitive | Use |
| --- | --- |
| `SceneLayer` | Absolutely positioned wrapper for a step's diagram; children that leave animate out |
| `Box` | Positioned entity: `id x y w? h? label? Icon? emphasis? className? style?` plus `data-*` |
| `Label`, `Frame`, `Emphasis`, `SymbolChip` | Box variants with `data-presentation-kind` of `label`, `frame`, `emphasis`, `symbol-chip` |
| `Arrow` | Line between points: `id from=[x,y] to=[x,y] both? dashed?`; colored by `currentColor` |
| `Appear` | Wrap arbitrary content so it enters after persisting entities settle |

**Every direct child of `SceneLayer` needs a `key` (use the entity id), and children must not be wrapped in fragments**: `SceneLayer` tracks entering and leaving children by key, and missing keys log a duplicate-key console error that fails verification.

`id` is the `layoutId`: keep an entity's id across steps so it morphs; give new things new ids. Prefix ids
with the slug (see `entities.ts`). `Icon` takes a lucide-react component, for example `Icon={User}`.
Other helpers: `sceneKey`, `tocEntries`, `usePresentationNav`, `useFitScale`, `computeFitScale`, and the
constants `DESIGN_W`, `DESIGN_H`, `MIN_SCALE`, `LAYOUT_T`, `ENTER_T`, `ENTER_DELAY`, `EASE`, `STAGE_LAYOUT`.

## Styling hooks (for the presentation's CSS)

`data-presentation-root` (with `-mode`, `-step-count`, `-step-index`), `-header`, `-footer`, `-title`,
`-caption`, `-era`, `-marker`, `-brand`, `-progress` / `-progress-item`, `-toc` / `-toc-item`,
`-prev`, `-next`, `-mode-toggle`, `-attribution`, `-stage`, `-canvas`, `-scene`, `-layer`,
`-entity` (the id), `-kind`, `-emphasis="true"`, `-label`, `-icon`, `-appear`.
Active chrome carries `data-presentation-active` and `aria-current="step"`.
Mark an intentional, readable overlap with `data-presentation-allow-overlap` on the layered element.
