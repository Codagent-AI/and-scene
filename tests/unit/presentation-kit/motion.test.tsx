import { expect, it } from 'vitest';
import { Appear } from '../../../src/presentation-kit/nodes/Appear';
import { Node } from '../../../src/presentation-kit/nodes/Node';
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../../src/presentation-kit/constants';
it('sequences newcomer entry after continuing layout and gives departures an undelayed exit', () => {
    const newcomer = Appear({ children: 'new' });
    expect(newcomer.props.initial).toEqual({ opacity: 0 });
    expect(newcomer.props.animate.transition.delay).toBe(ENTER_DELAY);
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T);
    expect(newcomer.props.exit.transition.duration).toBe(ENTER_T);
    expect(newcomer.props.exit.transition.delay).toBeUndefined();
    const continuing = Node({ id: 'stable', kind: 'box' });
    expect(continuing.props.layout).toBe(true);
    expect(continuing.props.layoutId).toBe('stable');
    expect(continuing.props.initial).toBeUndefined();
    expect(continuing.props.transition.layout.duration).toBe(LAYOUT_T);
});
