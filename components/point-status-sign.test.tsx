import { render } from '@testing-library/react-native';
import { expect, test } from '@jest/globals';
import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import Volume2 from 'lucide-react-native/icons/volume-2';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Lock from 'lucide-react-native/icons/lock';

import type { ComponentType } from 'react';
import { type CanonGlyph } from './canon-icon';
import { tokens } from './design-tokens';
import { PointStatusSign } from './point-status-sign';
import { getAllByType, getByType, queryAllByType } from "../test/render-helpers";


// RNTL 14 renders the host-only tree — the CanonIcon composite is flattened
// into the lucide svg host, so the glyph identity reads as the rendered path
// data (compared against the raw lucide glyph) and the color as the stroke.
async function glyphPathData(glyph: ComponentType<{ color?: string; size?: number; fill?: string }>) {
  const rendered = await render(
    <View>{createElement(glyph, { size: 17, color: tokens.colorAccentInk, fill: "none" })}</View>,
  );
  return getAllByType(rendered, "RNSVGPath").map((p) => p.props.d);
}

const cases = [
  ['played', Check, tokens.colorMarkerPlayed],
  ['playing', Volume2, tokens.colorMarkerPlaying],
  ['pending', Hourglass, tokens.colorMarkerPending],
  ['locked', Lock, tokens.colorMarkerLocked],
  ['available', null, tokens.colorMarkerAvailable],
] as const;

test('M7 renders five distinct signs, canonical fills and a plain available dot', async () => {
  const signs = new Set();
  for (const [status, glyph, color] of cases) {
    const tree = await render(<PointStatusSign status={status} label={status} testID="sign" />);
    const svgs = queryAllByType(tree, "RNSVGSvgView");
    expect(svgs).toHaveLength(glyph ? 1 : 0);
    if (glyph) {
      const paths = getAllByType(svgs[0], "RNSVGPath").map((p) => p.props.d);
      expect(paths).toEqual(await glyphPathData(glyph));
      expect(svgs[0].props.stroke).toBe(tokens.colorAccentInk);
      signs.add(glyph);
    } else signs.add(null);
    const dot = tree.getByTestId('sign', { includeHiddenElements: true });
    expect(StyleSheet.flatten(dot.props.style)).toMatchObject({
      backgroundColor: color, width: tokens.markerSize, height: tokens.markerSize,
      borderColor: tokens.colorAccentInk, borderWidth: 2,
    });
    expect(dot.props.accessibilityElementsHidden).toBe(true);
    expect(dot.props.importantForAccessibility).toBe('no-hide-descendants');
    await tree.unmount();
  }
  expect(signs.size).toBe(5);
});

test('compact card/list signs keep the same glyph with no separate status drawing', async () => {
  const tree = await render(<PointStatusSign status="locked" label="зачынена" small testID="small-sign" />);
  expect(StyleSheet.flatten(tree.getByTestId('small-sign', { includeHiddenElements: true }).props.style).width).toBe(22);
  const svg = getByType(tree, "RNSVGSvgView");
  expect(getAllByType(svg, "RNSVGPath").map((p) => p.props.d)).toEqual(await glyphPathData(Lock));
});
