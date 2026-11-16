// Issue #216 (M11) — the main menu's surface in the on-device storybook:
// the scattered pieces with their medallions (the approved menu.html look,
// decisions M2/M4/M11) and the waiting-piece state — kudy dimmed with the
// hourglass medallion, tap-only. Plain-object CSF args, no Storybook
// packages (the storybook-gate guard); the map carries its own assets.
import type { ComponentProps } from "react";

import { HomeMapMenu } from "./city-map-menu";

// The CSF meta (the default export): the component the stories attach to.
const meta = { title: "components/city-map-menu", component: HomeMapMenu } as const;
export default meta;

// The story shape Storybook (DQ-13) reads — declared locally, the file has
// no runtime Storybook dependency.
export type CityMapMenuStory = {
  name: string;
  args: ComponentProps<typeof HomeMapMenu>;
};

export const menu: CityMapMenuStory = {
  name: "menu",
  args: { width: 360, locale: "be", onSelect: () => {} },
};

// The story list of this file: every named export joins it in the same
// change (the ad-container idiom's single-source shape).
export const stories: readonly CityMapMenuStory[] = [menu];
