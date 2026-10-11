import { Presentation } from '../../src/presentation-kit';
import type { Step, SceneProps } from '../../src/presentation-kit';
interface Payload {
    readonly entities: readonly {
        id: string;
        x: number;
    }[];
}
function TypedScene({ payload }: SceneProps<Payload>) { return <div>{payload.entities.map(entity => <span key={entity.id}>{entity.x}</span>)}</div>; }
const steps: readonly Step<Payload>[] = [{ id: 'typed', era: 'types', title: 'Typed payload', caption: 'No boundary cast', Scene: TypedScene, payload: { entities: [{ id: 'one', x: 12 }] }, groupKey: 'typed' }];
export const typedBoundary = <Presentation steps={steps}/>;
// @ts-expect-error payload fields must match the Scene contract
export const rejectedPayload: Step<Payload> = { ...steps[0], payload: { entities: [{ id: 'bad', x: 'invalid' }] } };
