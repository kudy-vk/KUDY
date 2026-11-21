// Accepted vector preview, quality v6 (2026-10-28). These guards cover the
// features the SVG tree can prove. The paw/head seams, roundness and subtle
// highlights still need rendered-frame inspection at phone scale.
import { expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { Path } from "react-native-svg";

import { AnimatedSplash } from "./animated-splash";
import { getAllByType } from "../test/render-helpers";


type SvgPathNode = { props: { d?: unknown; fill?: unknown }; parent: SvgPathNode | null };

// RNTL 14 renders the host-only tree and react-native-svg 15 delivers the
// processed paint as {type, payload} ARGB ints: an explicit color keeps its
// payload, "none" extracts to null and an unset fill falls back to the
// opaque-black default payload below. The paw body paints through SVG
// inheritance — its own fill prop is the unset default, the real color
// rides the part group above it — so the effective paint of a node is the
// nearest ancestor payload that is not that unset default.
const UNSET_FILL = 4278190080;
const fillPayloadOf = (fill: unknown): number | null => {
  if (fill !== null && typeof fill === "object" && "payload" in (fill as object)) {
    return Number((fill as { payload: unknown }).payload);
  }
  return null;
};
const effectiveFillOf = (path: SvgPathNode): number | null => {
  let node: SvgPathNode | null = path;
  while (node) {
    const payload = fillPayloadOf(node.props.fill);
    if (payload !== null && payload !== UNSET_FILL) return payload;
    node = node.parent;
  }
  return null;
};

test("both raised paws have separate, contrasting vector claws", async () => {
  await render(<AnimatedSplash elapsedMs={1_200} brandName="KUDY" />);

  for (const side of ["left", "right"] as const) {
    const paw = screen.getByTestId(`splash-paw-${side}`);
    const claws = screen.getByTestId(`splash-claws-${side}`);
    const clawPaths: SvgPathNode[] = getAllByType(claws, "RNSVGPath");
    const pawPaths: SvgPathNode[] = getAllByType(paw, "RNSVGPath");
    // The first path under the paw is the body (the part renders before the
    // claws); its inherited fill is the paw's paint.
    const pawFill = effectiveFillOf(pawPaths[0]);

    expect(clawPaths.length).toBeGreaterThanOrEqual(3);
    expect(new Set(clawPaths.map((path) => String(path.props.d ?? ""))).size).toBeGreaterThanOrEqual(3);
    expect(pawFill).not.toBeNull();
    expect(clawPaths.every((path) => {
      const fill = effectiveFillOf(path);
      return fill !== null && fill !== pawFill;
    })).toBe(true);
  }
});

test("two vector eye outlines fade with the eyes during the blink", async () => {
  const { rerender } = await render(<AnimatedSplash elapsedMs={3_300} brandName="KUDY" />);
  const outlines = screen.getByTestId("splash-eye-outlines");
  const paths: SvgPathNode[] = getAllByType(outlines, "RNSVGPath");
  const contourCount = paths.reduce(
    (count, path) => count + (String(path.props.d ?? "").match(/[Mm]/g)?.length ?? 0),
    0,
  );

  expect(contourCount).toBeGreaterThanOrEqual(2);
  expect(outlines.props.opacity ?? 1).toBe(1);
  // RNTL 14: rerender is async like render — await it so the reanimated
  // jest mock re-evaluates the blink opacity at the new elapsed time.
  await rerender(<AnimatedSplash elapsedMs={3_650} brandName="KUDY" />);
  expect(screen.getByTestId("splash-eye-outlines").props.opacity).toBe(0);
});
