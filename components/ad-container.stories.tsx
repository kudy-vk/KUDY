// #215 — the ad container's states in the on-device storybook (decision M6):
// the reserved 90dp slot when an ad is loaded, and the collapse when none is
// — the not-loaded story renders an empty block, which is the point: the
// zone vanishes and leaves no empty space. Plain-object CSF args, no
// Storybook packages (the storybook-gate guard); the real creative is
// #101's wiring.
import type { ComponentProps } from "react";

import { AdContainer } from "./ad-container";

// The CSF meta (the default export): the component the stories attach to.
const meta = { title: "components/ad-container", component: AdContainer } as const;
export default meta;

// The story shape Storybook (DQ-13) reads — declared locally, the file has
// no runtime Storybook dependency.
export type AdContainerStory = {
  name: string;
  args: ComponentProps<typeof AdContainer>;
};

export const loaded: AdContainerStory = {
  name: "loaded",
  args: { loaded: true },
};

export const notLoaded: AdContainerStory = {
  name: "not-loaded",
  args: { loaded: false },
};

// The story list of this file: every named export joins it in the same
// change (the guide-card idiom's single-source shape).
export const stories: readonly AdContainerStory[] = [loaded, notLoaded];
