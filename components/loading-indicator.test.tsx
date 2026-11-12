// UX 07 (screens-and-transitions.md — Кантроль покрыцця станаў) — the guard over the one shared loading row: the small
// ActivityIndicator stands next to the state text. Removing the indicator
// (or the text) turns the suite red (implementation-rules 1).
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { LoadingIndicator } from "./loading-indicator";

describe("LoadingIndicator (UX 07 — screens-and-transitions.md, Кантроль покрыцця станаў)", () => {
  test("the spinner stands next to the state text", () => {
    render(<LoadingIndicator text="Загрузка…" />);
    expect(screen.getByTestId("loading-indicator")).toBeTruthy();
    expect(screen.getByText("Загрузка…")).toBeTruthy();
  });
});
