# Scene kit contract

The kit owns behavior and fit geometry, not visual appearance. Consult the project's `src/presentation-kit/README.md` for its stable DOM hooks.

## Steps

A `Step<TPayload>` is `{ id, era, title, caption, Scene, payload, groupKey? }`. `Scene` receives `{ payload, stepIndex }` as `SceneProps<TPayload>`. Steps that share a `groupKey` and the same `Scene` keep one mounted scene instance; only `payload` changes, so entities update in place.

```tsx
type Payload = { stage: number }

function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Box entityId="you">you</Box>
      {payload.stage >= 2 && (
        <Appear>
          <Box entityId="skill">skill</Box>
        </Appear>
      )}
    </SceneLayer>
  )
}

const steps: Step<Payload>[] = [
  { id: 'ask', era: 'the ask', title: 'You have a topic', caption: '...', groupKey: 'scene', Scene, payload: { stage: 1 } },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: '...', groupKey: 'scene', Scene, payload: { stage: 2 } },
]
```

`<Presentation steps={steps} title="..." initialMode="browse" />` hosts the typed step array without casts. `initialMode` is `'present'` or `'browse'`; `attribution` and `brand` are optional.

## Node primitives

`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `Departing`, and `SceneLayer`. They accept class, style, and data attributes and supply no visual defaults.

- `entityId` sets `data-entity-id` and is the default `layoutId`; pass `layoutId` to override. Reuse the same value for a continuing entity so it morphs.
- `Box` takes an optional `Icon` (a lucide-react component).
- `Appear` fades a newcomer in after persisting entities have moved. Wrap only entities that are new in the step, or pass `isNew={false}`; never wrap continuing entities.
- `Departing` wraps an entity that leaves a grouped scene: render `<Departing show={condition}>` and the entity animates out when `show` turns false instead of vanishing. Keep `Departing` mounted across the step change and drive it only by `show`; if an ancestor unmounts, the exit animation is skipped. It accepts class, style, and data attributes for its wrapper. Entities that do not leave need no wrapper.
- `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another.
- For coordinate-heavy diagrams, use raw `motion` elements with stable `layoutId`s when a primitive does not fit.
