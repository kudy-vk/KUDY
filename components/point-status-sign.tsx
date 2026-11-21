import { StyleSheet, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import Volume2 from 'lucide-react-native/icons/volume-2';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Lock from 'lucide-react-native/icons/lock';

import type { StopStatus } from '../core/engine/state';
import { CanonIcon } from './canon-icon';
import { tokens } from './design-tokens';

const STATUS_GLYPH = {
  played: Check, playing: Volume2, pending: Hourglass, locked: Lock, available: null,
} satisfies Record<StopStatus, typeof Check | null>;

const STATUS_COLOR = {
  playing: tokens.colorMarkerPlaying,
  played: tokens.colorMarkerPlayed,
  available: tokens.colorMarkerAvailable,
  pending: tokens.colorMarkerPending,
  locked: tokens.colorMarkerLocked,
} satisfies Record<StopStatus, string>;

const styles = StyleSheet.create({
  dot: {
    alignItems: 'center', justifyContent: 'center',
    borderColor: tokens.colorAccentInk, borderRadius: 999, borderWidth: 2,
    elevation: 2, height: tokens.markerSize, width: tokens.markerSize,
    shadowColor: tokens.colorInk, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25, shadowRadius: 2,
  },
  small: { height: 22, width: 22 },
});

// The enclosing marker/card/row supplies the name and localized status to
// accessibility; hide this duplicate decoration from screen readers.
export function PointStatusSign({ status, label, small = false, testID }: {
  status: StopStatus; label: string; small?: boolean; testID?: string;
}) {
  const glyph = STATUS_GLYPH[status];
  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      pointerEvents="none" testID={testID}
      style={[styles.dot, small && styles.small, { backgroundColor: STATUS_COLOR[status] }]}>
      {glyph ? <CanonIcon glyph={glyph} label={label} color={tokens.colorAccentInk} size={small ? 13 : 17} /> : null}
    </View>
  );
}
