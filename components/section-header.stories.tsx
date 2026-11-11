// #215 — the section heading's state in the on-device storybook (kit.css
// `.sec`): the muted small line that groups a screen's list. Plain-object
// CSF args with a synthetic fixture only — no Storybook packages (the
// storybook-gate guard).
import type { ComponentProps } from "react";

import { SectionHeader } from "./section-header";

// The CSF meta (the default export): the component the stories attach to.
const meta = { title: "components/section-header", component: SectionHeader } as const;
export default meta;

// The story shape Storybook (DQ-13) reads — declared locally, the file has
// no runtime Storybook dependency.
export type SectionHeaderStory = {
  name: string;
  args: ComponentProps<typeof SectionHeader>;
};

export const section: SectionHeaderStory = {
  name: "section",
  args: { text: "Сінтэтычная секцыя спісу" },
};

// The story list of this file: every named export joins it in the same
// change (the guide-card idiom's single-source shape).
export const stories: readonly SectionHeaderStory[] = [section];
