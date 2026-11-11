// #215 — the round action button's states in the on-device storybook (the
// kit vocabulary: kit.mjs `fab()`): the enabled clay action, the reason line
// beside it (the pv-foot arrangement — text left, round action right), and
// the canon §5 ghost pair with and without the reason. Plain-object CSF
// args with synthetic fixtures only — no Storybook packages (the
// storybook-gate guard), nothing real is addressed.
import type { ComponentProps } from "react";

import Footprints from "lucide-react-native/icons/footprints";

import { Fab } from "./fab";

// The CSF meta (the default export): the component the stories attach to.
const meta = { title: "components/fab", component: Fab } as const;
export default meta;

// The story shape Storybook (DQ-13) reads — declared locally, the file has
// no runtime Storybook dependency.
export type FabStory = {
  name: string;
  args: ComponentProps<typeof Fab>;
};

const GLYPH = Footprints;
const LABEL = "Сінтэтычная галоўная дзея";
const REASON = "Сінтэтычная прычына чакання дзеі";

export const enabled: FabStory = {
  name: "enabled",
  args: { glyph: GLYPH, label: LABEL },
};

export const enabledReason: FabStory = {
  name: "enabled-reason",
  args: { glyph: GLYPH, label: LABEL, reason: REASON },
};

export const disabledReason: FabStory = {
  name: "disabled-reason",
  args: { glyph: GLYPH, label: LABEL, reason: REASON, disabled: true },
};

export const disabled: FabStory = {
  name: "disabled",
  args: { glyph: GLYPH, label: LABEL, disabled: true },
};

// The story list of this file: every named export joins it in the same
// change (the guide-card idiom's single-source shape).
export const stories: readonly FabStory[] = [enabled, enabledReason, disabledReason, disabled];
