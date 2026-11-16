import { beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, type ColorSchemeName } from "react-native";
import { RadialGradient, Rect, Stop } from "react-native-svg";

import { darkBackground, darkTokens, tokens } from "./design-tokens";
import { ScreenSurface } from "./screen-surface";

let mockScheme: ColorSchemeName = "light";
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockScheme,
}));

beforeEach(() => { mockScheme = "light"; });

function Counter() {
  const [count, setCount] = useState(0);
  return <Pressable onPress={() => setCount(count + 1)}><Text>{`Count ${count}`}</Text></Pressable>;
}

test("light mode paints canonical paper without a gradient", () => {
  render(<ScreenSurface testID="surface"><Text>Content</Text></ScreenSurface>);
  expect(StyleSheet.flatten(screen.getByTestId("surface").props.style).backgroundColor).toBe(tokens.colorPaper);
  expect(screen.queryByTestId("screen-gradient", { includeHiddenElements: true })).toBeNull();
  expect(screen.getByText("Content")).toBeTruthy();
});

test("dark mode paints the canonical full-size M3 gradient below content", () => {
  mockScheme = "dark";
  const view = render(<ScreenSurface testID="surface"><Text>Content</Text></ScreenSurface>);
  expect(StyleSheet.flatten(screen.getByTestId("surface").props.style).backgroundColor).toBe(darkTokens.colorPaper);
  const gradient = view.UNSAFE_getByType(RadialGradient);
  expect(gradient.props).toMatchObject({ cx: darkBackground.cx, cy: darkBackground.cy, rx: darkBackground.rx, ry: darkBackground.ry });
  expect(view.UNSAFE_getAllByType(Stop).map(({ props }) => ({ offset: props.offset, color: props.stopColor }))).toEqual(darkBackground.stops);
  expect(view.UNSAFE_getByType(Rect).props).toMatchObject({ width: "100%", height: "100%", fill: `url(#${gradient.props.id})` });
  const layer = screen.getByTestId("screen-gradient", { includeHiddenElements: true });
  expect(StyleSheet.flatten(layer.props.style)).toMatchObject({ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 });
  expect((view.toJSON() as { children: { props: { testID?: string } }[] }).children[0].props.testID).toBe("screen-gradient");
});

test("gradient ignores input and stays outside the accessibility tree", () => {
  mockScheme = "dark";
  render(<ScreenSurface><Counter /></ScreenSurface>);
  expect(screen.queryByTestId("screen-gradient")).toBeNull();
  expect(screen.getByTestId("screen-gradient", { includeHiddenElements: true }).props).toMatchObject({
    pointerEvents: "none", accessible: false, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants",
  });
  fireEvent.press(screen.getByText("Count 0"));
  expect(screen.getByText("Count 1")).toBeTruthy();
});

test("live appearance changes preserve mounted content and layout props", () => {
  const renderSurface = () => <ScreenSurface testID="surface" style={{ paddingTop: 47 }}><Counter /></ScreenSurface>;
  const view = render(renderSurface());
  fireEvent.press(screen.getByText("Count 0"));
  for (const scheme of ["dark", "light"] as const) {
    mockScheme = scheme;
    view.rerender(renderSurface());
    expect(screen.getByText("Count 1")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("surface").props.style).paddingTop).toBe(47);
  }
});
