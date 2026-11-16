// #215 — the section heading renders the caller's text with the kit `.sec`
// look; the words ride the catalogs, the component owns only the style.
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { tokens } from "./design-tokens";
import { SectionHeader } from "./section-header";

test("the section heading renders the caller's text, muted and small (kit .sec)", () => {
  render(<SectionHeader text="Паблизу" testID="sec" />);
  const header = screen.getByTestId("sec");
  expect(header.props.children).toBe("Паблизу");
  expect(header.props.style).toMatchObject({ color: tokens.colorMuted, fontSize: 13 });
});
