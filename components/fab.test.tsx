// #215 — the round action button's contract: the accent round button with
// the screen-reader name, the reason line left of it, and the canon §5
// disabled state as the ghost pair (transparent fill, disabled frame,
// disabled glyph, no shelf) — never an opacity dim.
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import Footprints from "lucide-react-native/icons/footprints";

import { CanonIcon } from "./canon-icon";
import { tokens } from "./design-tokens";
import { Fab } from "./fab";
import { ScaledText } from "./scaled-text";

const LABEL = "Пачаць прагулку";
const REASON = "Сінтэтычная прычына чакання дзеі";

// A structural slice of the test-renderer instance: the repo carries no
// react-test-renderer type package (skipLibCheck hides the gap), so the
// tree walk types locally instead of a TS7016 import.
type TestNode = {
  parent?: TestNode | null;
  children: TestNode[];
  props: { style?: unknown; testID?: string } & Record<string, unknown>;
  type: unknown;
};

type Style = Record<string, unknown>;

// PressableSurface hands a state-dependent style; RNTL renders it with the
// rest state, so the resolved value is a (nested) style array.
function layers(element: { props: { style?: unknown } }): Style[] {
  const flat = (style: unknown): Style[] =>
    Array.isArray(style) ? style.flatMap(flat) : style ? [style as Style] : [];
  return flat(element.props.style);
}

test("enabled: the accent round button with the screen-reader name and the clay shelf", () => {
  const onPress = jest.fn();
  render(<Fab glyph={Footprints} label={LABEL} onPress={onPress} testID="fab" />);
  const button = screen.getByTestId("fab");
  expect(button.props.accessibilityRole).toBe("button");
  expect(button.props.accessibilityLabel).toBe(LABEL);
  expect(button.props.accessibilityState).toMatchObject({ disabled: false });
  const stack = layers(button);
  expect(stack[0]).toMatchObject({ backgroundColor: tokens.colorAccent, height: 56, width: 56 });
  expect(stack.some((layer) => layer.borderBottomColor === tokens.colorShelfAccent)).toBe(true);
  fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
});

test("disabled: the canon §5 ghost pair — transparent fill, disabled frame, disabled glyph, no shelf", () => {
  const onPress = jest.fn();
  render(<Fab glyph={Footprints} label={LABEL} disabled onPress={onPress} testID="fab" />);
  const button = screen.getByTestId("fab");
  expect(button.props.accessibilityState).toMatchObject({ disabled: true });
  const stack = layers(button);
  // The ghost pair wins the merge: the accent fill drops out, the disabled
  // frame and the transparent fill stand (canon §5, no opacity anywhere).
  const merged = Object.assign({}, ...stack);
  expect(merged.backgroundColor).toBe("transparent");
  expect(merged.borderColor).toBe(tokens.colorDisabledLine);
  // No shelf on the disabled state — the ghost pair stands alone.
  expect(stack.some((layer) => layer.borderBottomColor === tokens.colorShelfAccent)).toBe(false);
  // No opacity anywhere in the disabled stack — the canon §5 «без празрыстасці».
  expect(stack.some((layer) => "opacity" in layer)).toBe(false);
  fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
  // The glyph rides the disabled ink of the ghost pair.
  const icon = screen.UNSAFE_getByType(CanonIcon);
  expect(icon.props.color).toBe(tokens.colorDisabledInk);
});

test("the reason line renders left of the button when the screen passes one", () => {
  const view = render(<Fab glyph={Footprints} label={LABEL} reason={REASON} testID="fab" />);
  // Exactly one text node: the reason, on the shared row before the round
  // action (the pv-foot arrangement — text left, action right).
  const texts = view.UNSAFE_queryAllByType(Text);
  expect(texts).toHaveLength(1);
  expect(texts[0].props.children).toBe(REASON);
  expect(texts[0].props.style).toMatchObject({ flex: 1 });
  // The nearest row above the text carries both the reason and the button,
  // the reason first — the row order is the left-to-right order.
  let row = texts[0].parent as TestNode | null | undefined;
  while (row && !layers(row).some((layer) => layer.flexDirection === "row")) row = row.parent;
  expect(row).toBeTruthy();
  const kids: TestNode[] = row ? row.children : [];
  expect(kids[0]?.type).toBe(ScaledText);
  expect(kids[kids.length - 1]?.props.testID).toBe("fab");
});

test("no reason passed — no text node, the button stands alone", () => {
  const view = render(<Fab glyph={Footprints} label={LABEL} testID="fab" />);
  expect(view.UNSAFE_queryAllByType(Text)).toHaveLength(0);
});
