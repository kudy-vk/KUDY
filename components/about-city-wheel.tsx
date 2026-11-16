// Issue #252, decision M9 — the carousel of sections: a wheel with inertia.
// The items stand on a ring, all the same size; the one in the middle is the
// open section. A drag turns the wheel, and on release it keeps turning with
// the speed of the hand: a light push moves it by one item, a strong one by
// several. It always stops with an item exactly in the middle. A press on a
// side item brings that item to the middle. With the system setting
// «reduce motion» the wheel jumps to its place without animation.
// The geometry and the coast math are the port of the owner-approved mockup
// module docs/design/production/about-wheel.mjs (#202) — the two pure
// functions keep its exact numbers and carry the screen's tests.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Line } from "react-native-svg";

import { AboutCityMedal } from "./about-city-medal";
import type { CanonGlyph } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { ScaledText } from "./scaled-text";
import { useThemeStyles, useThemeTokens } from "./theme";

export const COAST_TIME = 300; // ms: the time constant of the coast after a push
export const STEP_TIME = 110; // ms: the time constant of a move by a press
export const SPEED_WINDOW = 100; // ms: the end of the drag the speed is measured over
export const TAP_SLOP = 6; // px: a shorter move is a press, not a drag
export const MAX_TURN = 1.5; // rings: the longest coast after one push

export type SpeedSample = readonly [time: number, x: number];

// The speed of the hand at the end of a drag, px per ms; positive when the
// hand moved left, so the wheel turns forward. `samples` are [time, x] of the
// pointer in order, the last one being the last move; `releasedAt` is the
// time of the release. A hand that stood still before letting go gives 0.
export function releaseSpeed(samples: readonly SpeedSample[], releasedAt: number): number {
  const [lastTime, lastX] = samples[samples.length - 1];
  if (releasedAt - lastTime >= SPEED_WINDOW) return 0;
  const window = samples.filter(([time]) => lastTime - time <= SPEED_WINDOW);
  const [firstTime, firstX] = window[0] ?? [lastTime, lastX];
  return lastTime > firstTime ? (firstX - lastX) / (lastTime - firstTime) : 0;
}

// The push travel caps at MAX_TURN rings either way, and the wheel settles
// on the item nearest to that point.
const clampTravel = (travel: number, cap: number) => Math.max(-cap, Math.min(cap, travel));
const nearestSlot = (at: number, slot: number) => Math.round(at / slot) * slot;

// Where the wheel stops after a push, px along the ring: it travels on for
// speed × COAST_TIME (at most MAX_TURN rings either way) and settles on the
// nearest item. `position` is where the wheel was let go, `slot` the width of
// an item, `count` the number of items. Speed 0 gives the nearest item.
export function stopAfterPush({ position, speed, slot, count }: {
  position: number;
  speed: number;
  slot: number;
  count: number;
}): number {
  const cap = MAX_TURN * count * slot;
  return nearestSlot(position + clampTravel(speed * COAST_TIME, cap), slot);
}

export type AboutCityWheelItem = { id: string; icon: CanonGlyph; label: string };

const MEDAL_BOX = 80;
const SLOT_TOP = 6;
const LABEL_LINES = 2.4; // em of the label box (the mockup's .label height)
const WHEEL_BOTTOM = 14;
// The mockup's .wheel height: the medal box, the two label lines at the
// app's big-text cap and the bottom mark — every wheel width reuses it.
const WHEEL_HEIGHT = 92 + LABEL_LINES * 12 * tokens.fontBigTextFactor + WHEEL_BOTTOM;

type Drag = { from: number; moved: boolean; samples: SpeedSample[] };

// items: the five sections in their order. `slot` is the width of one item
// in px. onSelect(index, direction) fires as soon as the wheel knows where
// it stops; direction is +1 when it turned forward, −1 backward.
export function AboutCityWheel({
  items,
  index = 0,
  slot,
  label,
  onSelect,
}: {
  items: readonly AboutCityWheelItem[];
  index?: number;
  slot: number;
  label: string;
  onSelect: (index: number, direction: number) => void;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  const count = items.length;
  const ring = count * slot;
  const [position, setPosition] = useState(index * slot);
  const [chosen, setChosen] = useState(index);
  const [calm, setCalm] = useState(false);
  // The live wheel state the animation loop and the gesture handlers read:
  // a render closure can lag a frame behind the running coast.
  const live = useRef({ position: index * slot, goal: index * slot, frame: 0, chosen: index });

  useEffect(() => {
    // The system «reduce motion» setting: the wheel jumps without animation.
    AccessibilityInfo.isReduceMotionEnabled?.().then(setCalm).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setCalm);
    return () => {
      subscription?.remove();
      cancelAnimationFrame(live.current.frame);
    };
  }, []);

  // Signed distance of item i from the middle, along the shorter way round.
  const offset = (i: number, at: number) => {
    let distance = (((i * slot - at) % ring) + ring) % ring;
    if (distance > ring / 2) distance -= ring;
    return distance;
  };
  const choose = (next: number, direction: number) => {
    if (live.current.chosen === next) return;
    live.current.chosen = next;
    setChosen(next);
    onSelectRef.current(next, direction);
  };
  // Moves to `target` (px), slowing down the way a flicked list does: with
  // the time constant `time` the wheel starts at the speed
  // (target − position) / time.
  const coast = (target: number, time: number) => {
    cancelAnimationFrame(live.current.frame);
    live.current.goal = target;
    choose(((Math.round(target / slot) % count) + count) % count, Math.sign(target - live.current.position) || 1);
    if (calm) {
      live.current.position = target;
      setPosition(target);
      return;
    }
    const from = live.current.position;
    const started = Date.now();
    const tick = () => {
      const next = target - (target - from) * Math.exp(-(Date.now() - started) / time);
      const settled = Math.abs(target - next) < 0.4;
      live.current.position = settled ? target : next;
      setPosition(live.current.position);
      if (!settled) live.current.frame = requestAnimationFrame(tick);
    };
    live.current.frame = requestAnimationFrame(tick);
  };

  const drag = useRef<Drag | null>(null);
  // The pan handlers are memoized; the select callback arrives through a ref
  // so a parent re-render never leaves the wheel calling a stale closure.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const panResponder = useMemo(() => PanResponder.create({
    // A press stays with the item button; the wheel takes the gesture over
    // only when the hand really drags sideways (a vertical page scroll
    // passes through — the mockup's touch-action: pan-y). The drag starts
    // here because the responder arrives after the tap slop, when the
    // position has not moved yet.
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => {
      const wants = Math.abs(gesture.dx) > TAP_SLOP && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      if (wants) {
        drag.current = {
          from: live.current.position,
          moved: true,
          samples: [[Date.now(), gesture.moveX]],
        };
        cancelAnimationFrame(live.current.frame);
      }
      return wants;
    },
    onPanResponderMove: (_, gesture) => {
      const current = drag.current;
      if (!current) return;
      current.samples.push([Date.now(), gesture.moveX]);
      if (current.samples.length > 24) current.samples.shift();
      const next = current.from - gesture.dx;
      live.current.position = next;
      setPosition(next);
    },
    onPanResponderRelease: (_, gesture) => {
      const current = drag.current;
      drag.current = null;
      if (!current) return;
      // The wheel goes on at the speed of the hand: the harder the push,
      // the farther it turns.
      const stop = stopAfterPush({
        position: live.current.position,
        speed: releaseSpeed(current.samples, Date.now()),
        slot,
        count,
      });
      coast(stop, Math.abs(stop - live.current.position) > slot ? COAST_TIME : STEP_TIME);
    },
    // The system took the gesture away (a touch that became a page scroll):
    // this is neither a press nor a push, so the wheel settles on the
    // nearest item.
    onPanResponderTerminate: () => {
      drag.current = null;
      coast(Math.round(live.current.position / slot) * slot, STEP_TIME);
    },
  }), [slot, count, calm]);

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.wheel, { height: WHEEL_HEIGHT }]}
      testID="about-city-wheel"
      {...panResponder.panHandlers}
    >
      <Svg style={styles.ring} pointerEvents="none">
        <Line
          x1={0} y1={SLOT_TOP + MEDAL_BOX / 2} x2="100%" y2={SLOT_TOP + MEDAL_BOX / 2}
          stroke={palette.colorLine} strokeWidth={2} strokeDasharray="1 9" strokeLinecap="round"
        />
      </Svg>
      {items.map((item, i) => {
        const distance = offset(i, position);
        const near = Math.max(0, 1 - Math.abs(distance) / slot);
        return (
          <View
            key={item.id}
            style={[styles.slot, { marginLeft: -slot / 2, width: slot, transform: [{ translateX: distance }] }]}
            pointerEvents="box-none"
          >
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: i === chosen }}
              onPress={() => coast(live.current.position + offset(i, live.current.position), STEP_TIME)}
              style={styles.slotButton}
              testID={`wheel-item-${item.id}`}
            >
              <View style={{ transform: [{ scale: 0.72 + 0.28 * near }] }}>
                <AboutCityMedal glyph={item.icon} label={item.label} near={near} />
              </View>
              <ScaledText style={[styles.slotLabel, { color: palette.colorInk, opacity: 0.45 + 0.55 * near }]}>
                {item.label}
              </ScaledText>
            </Pressable>
          </View>
        );
      })}
      {/* The mark under the middle item: this section is open below. */}
      <View style={styles.mark} />
    </View>
  );
}

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  wheel: {
    borderBottomColor: palette.colorLine,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  ring: {
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  slot: {
    alignItems: "center",
    bottom: WHEEL_BOTTOM,
    gap: 4,
    left: "50%",
    position: "absolute",
    top: SLOT_TOP,
  },
  slotButton: {
    alignItems: "center",
    gap: 4,
  },
  slotLabel: {
    fontSize: 12 * tokens.fontBigTextFactor,
    lineHeight: 12 * tokens.fontBigTextFactor * 1.2,
    textAlign: "center",
  },
  mark: {
    backgroundColor: palette.colorPaper,
    borderColor: palette.colorLine,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    bottom: -6,
    height: 11,
    left: "50%",
    marginLeft: -6,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
    width: 11,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);
