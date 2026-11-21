import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { expect, jest, test } from '@jest/globals';
import { StyleSheet, Text } from 'react-native';

import { RunNativeMap } from './run-native-map';
import { tokens } from './design-tokens';


const { cameraCalls } = require('../test/maplibre-react-native-mock') as {
  cameraCalls: Array<{ center: [number, number]; zoom: number; duration: number }>;
};

const props = {
  view: {
    markers: [{ stopId: 'stop-1', name: 'Мытня', status: 'available' as const, nx: 0.5, ny: 0.5 }],
    pois: [],
  },
  stops: [{ stopId: 'stop-1', lat: 54.35, lng: 18.65, radius: 30 }],
  places: [],
  fallback: <Text testID="map-fallback">Схема</Text>,
  onOpenStop: jest.fn(),
  onReadyChange: jest.fn(),
  recenterLabel: 'Да майго месцазнаходжання',
  pointsLabel: 'Кропкі маршруту',
  retryLabel: 'Паўтарыць',
  markerHint: 'Прагляд кропкі. Аўдыё не запускаецца.',
  statusWords: { available: 'даступна' },
  poiWords: {},
};

test('loaded native map uses geographic markers and the walk GPS observer', async () => {
  cameraCalls.length = 0;
  let positionHandler: ((center: [number, number]) => void) | null = null;
  const unsubscribe = jest.fn();
  const onMapPosition = jest.fn((handler: (center: [number, number]) => void) => { positionHandler = handler; return unsubscribe; });
  const rendered = await render(<RunNativeMap {...props} onMapPosition={onMapPosition} />);
  expect(screen.getByTestId('map-fallback')).toBeTruthy();
  await fireEvent(screen.getByTestId('run-native-map'), 'onDidFinishLoadingMap');
  expect(screen.queryByTestId('map-fallback')).toBeNull();
  expect(props.onReadyChange).toHaveBeenLastCalledWith(true);
  expect(screen.getByTestId('mock-map-marker-stop-1').props.lngLat).toEqual([18.65, 54.35]);
  expect(screen.getByTestId('run-marker-stop-1')).toBeTruthy();
  expect(screen.getByTestId('run-marker-stop-1').props.accessibilityHint).toBe(props.markerHint);
  expect(screen.getByTestId('run-marker-stop-1').props.style.minHeight).toBeGreaterThanOrEqual(48);
  await fireEvent.press(screen.getByTestId('run-map-points'));
  expect(screen.getByTestId('run-point-status-stop-1').props.children).toBe('Мытня — даступна');
  expect(screen.getByTestId('run-point-stop-1').props.accessibilityHint).toBe(props.markerHint);
  await fireEvent.press(screen.getByTestId('run-point-stop-1'));
  expect(props.onOpenStop).toHaveBeenCalledWith('stop-1');
  await act(() => positionHandler?.([18.651, 54.351]));
  expect(screen.getByTestId('run-current-position')).toBeTruthy();
  expect(cameraCalls.at(-1)).toEqual(expect.objectContaining({ center: [18.651, 54.351], zoom: 16 }));
  expect(onMapPosition).toHaveBeenCalledTimes(1);
  await rendered.unmount();
  expect(unsubscribe).toHaveBeenCalled();
});

test('a user pan pauses camera follow until recenter; tile failure keeps the schematic', async () => {
  cameraCalls.length = 0;
  let positionHandler: ((center: [number, number]) => void) | null = null;
  const onMapPosition = (handler: (center: [number, number]) => void) => { positionHandler = handler; return () => {}; };
  await render(<RunNativeMap {...props} onMapPosition={onMapPosition} />);
  const map = screen.getByTestId('run-native-map');
  await fireEvent(map, 'onDidFinishLoadingMap');
  await act(() => positionHandler?.([18.651, 54.351]));
  const beforePan = cameraCalls.length;
  await fireEvent(map, 'onRegionWillChange', { nativeEvent: { userInteraction: true } });
  await act(() => positionHandler?.([18.652, 54.352]));
  expect(cameraCalls).toHaveLength(beforePan);
  await fireEvent.press(screen.getByTestId('run-map-recenter'));
  expect(cameraCalls).toHaveLength(beforePan + 1);
  expect(screen.queryByTestId('run-map-recenter')).toBeNull();
  await fireEvent(map, 'onDidFailLoadingMap');
  expect(screen.getByTestId('map-fallback')).toBeTruthy();
  expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
  await fireEvent.press(screen.getByTestId('run-map-retry'));
  expect(screen.getByTestId('run-native-map')).toBeTruthy();
  await fireEvent(screen.getByTestId('run-native-map'), 'onDidFinishLoadingMap');
  expect(screen.queryByTestId('map-fallback')).toBeNull();
  expect(props.onReadyChange).toHaveBeenLastCalledWith(true);
});

test('points list exposes labelled POIs without a stop-card action', async () => {
  await render(<RunNativeMap {...props} view={{ ...props.view, pois: [{ placeId: 'poi-1', kind: 'cafe', nx: 0.5, ny: 0.5 }] }}
    places={[{ placeId: 'poi-1', lat: 54.36, lng: 18.66, radius: 10, kind: 'cafe' }]}
    poiWords={{ cafe: 'Кавярня' }} onMapPosition={() => () => {}} />);
  await fireEvent(screen.getByTestId('run-native-map'), 'onDidFinishLoadingMap');
  await fireEvent.press(screen.getByTestId('run-map-points'));
  expect(screen.getByTestId('run-poi-points-group')).toBeTruthy();
  expect(screen.getByTestId('run-poi-point-poi-1').props.accessible).toBe(true);
  expect(screen.getByTestId('run-poi-point-poi-1').props.accessibilityLabel).toBe('Кавярня');
  expect(props.onOpenStop).not.toHaveBeenCalledWith('poi-1');
});

test('missing geometry keeps every session marker on the schematic', async () => {
  await render(<RunNativeMap
    {...props}
    view={{ markers: [{ stopId: 'missing', name: 'Без каардынатаў', status: 'pending', nx: 0.5, ny: 0.5 }], pois: [] }}
    onMapPosition={() => () => {}}
  />);
  expect(screen.queryByTestId('run-native-map')).toBeNull();
  expect(screen.getByTestId('map-fallback')).toBeTruthy();
});

test.each(['available', 'played', 'playing', 'pending', 'locked'] as const)('native marker and point list share the %s sign and keep status labels', async (status) => {
  const statusWords = { [status]: `state: ${status}` };
  await render(<RunNativeMap {...props} statusWords={statusWords}
    view={{ ...props.view, markers: [{ ...props.view.markers[0], status }] }} onMapPosition={() => () => {}} />);
  await fireEvent(screen.getByTestId('run-native-map'), 'onDidFinishLoadingMap');
  await fireEvent.press(screen.getByTestId('run-map-points'));
  // RNTL 14 renders the host-only tree — the PointStatusSign composite no
  // longer appears as an instance, so its status/label props pin on the
  // hosts that carry the same contract (the binding point-status-sign.test
  // .tsx owns): the status as the marker color token on the sign View, the
  // label as the icon wrapper's accessibilityLabel — glyph statuses only;
  // 'available' renders the plain dot with no icon and the enclosing marker
  // carries the name (asserted below).
  const markerColors = {
    available: tokens.colorMarkerAvailable,
    played: tokens.colorMarkerPlayed,
    playing: tokens.colorMarkerPlaying,
    pending: tokens.colorMarkerPending,
    locked: tokens.colorMarkerLocked,
  };
  for (const id of ['run-marker-sign-stop-1', 'run-point-sign-stop-1']) {
    const sign = screen.getByTestId(id);
    expect(StyleSheet.flatten(sign.props.style).backgroundColor).toBe(markerColors[status]);
    if (status === 'available') {
      expect(within(sign).queryByLabelText(statusWords[status])).toBeNull();
    } else {
      expect(within(sign).getByLabelText(statusWords[status])).toBeTruthy();
    }
  }
  for (const id of ['run-marker-stop-1', 'run-point-stop-1']) {
    expect(screen.getByTestId(id).props.accessibilityLabel).toBe(`Мытня, state: ${status}`);
  }
  expect(screen.getByTestId('run-status-stop-1').props.children).toBe(`Мытня — state: ${status}`);
});
