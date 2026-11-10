import { render } from '@testing-library/react-native';
import { expect, test } from '@jest/globals';
import { StyleSheet } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import Volume2 from 'lucide-react-native/icons/volume-2';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Lock from 'lucide-react-native/icons/lock';

import { CanonIcon } from './canon-icon';
import { tokens } from './design-tokens';
import { PointStatusSign } from './point-status-sign';

const cases = [
  ['played', Check, tokens.colorMarkerPlayed],
  ['playing', Volume2, tokens.colorMarkerPlaying],
  ['pending', Hourglass, tokens.colorMarkerPending],
  ['locked', Lock, tokens.colorMarkerLocked],
  ['available', null, tokens.colorMarkerAvailable],
] as const;

test('M7 renders five distinct signs, canonical fills and a plain available dot', () => {
  const signs = new Set();
  for (const [status, glyph, color] of cases) {
    const tree = render(<PointStatusSign status={status} label={status} testID="sign" />);
    const icons = tree.UNSAFE_queryAllByType(CanonIcon);
    expect(icons).toHaveLength(glyph ? 1 : 0);
    if (glyph) {
      expect(icons[0].props.glyph).toBe(glyph);
      expect(icons[0].props.color).toBe(tokens.colorAccentInk);
      signs.add(icons[0].props.glyph);
    } else signs.add(null);
    const dot = tree.getByTestId('sign', { includeHiddenElements: true });
    expect(StyleSheet.flatten(dot.props.style)).toMatchObject({
      backgroundColor: color, width: tokens.markerSize, height: tokens.markerSize,
      borderColor: tokens.colorAccentInk, borderWidth: 2,
    });
    expect(dot.props.accessibilityElementsHidden).toBe(true);
    expect(dot.props.importantForAccessibility).toBe('no-hide-descendants');
    tree.unmount();
  }
  expect(signs.size).toBe(5);
});

test('compact card/list signs keep the same glyph with no separate status drawing', () => {
  const tree = render(<PointStatusSign status="locked" label="зачынена" small testID="small-sign" />);
  expect(StyleSheet.flatten(tree.getByTestId('small-sign', { includeHiddenElements: true }).props.style).width).toBe(22);
  expect(tree.UNSAFE_getByType(CanonIcon).props.glyph).toBe(Lock);
});
