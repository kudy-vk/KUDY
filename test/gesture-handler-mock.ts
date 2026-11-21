// The shared RNGH jest stand-in for the suites that render the «Пра горад»
// map (#303): the gestures run on the RNGH/Reanimated layer jest cannot
// host, so the render suites stub the builder out — every builder call
// returns the same chainable shape, Simultaneous/Race/Exclusive collect
// their gestures, the detector is a pass-through and the root view carries
// the box props (testID, the layout) through a plain View. The pick logic
// runs in the pure modules and is guarded by test/about-map.test.mjs.
// One copy, not two (the jscpd gate).
import { createElement, type ReactNode } from "react";
import { View } from "react-native";

export function gestureHandlerMock(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const step = (): unknown =>
    new Proxy(() => step(), {
      get: (_t, prop) => (String(prop) in chain ? chain[String(prop)] : () => step()),
      apply: () => step(),
    });
  return {
    Gesture: new Proxy(
      {},
      {
        get: (_target, name) => {
          if (name === "Simultaneous" || name === "Race" || name === "Exclusive") {
            return (...gestures: unknown[]) => ({ composed: gestures });
          }
          return step();
        },
      },
    ),
    GestureHandlerRootView: (props: { children?: ReactNode }) => createElement(View, props),
    GestureDetector: (props: { children?: ReactNode }) => props.children,
  };
}
