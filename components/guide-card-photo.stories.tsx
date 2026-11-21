// #215 — the guide card's photo state: the kit offer anatomy's 64×64 photo
// place. Its own stories file on purpose: the DQ-03 V1 baseline matrix
// parses the four reviewed stories of guide-card.stories.tsx
// (tools/e2e-android/visual-check.mjs) and a new matrix slot would demand a
// device-captured baseline — the photo state joins the storybook without
// joining that enforced matrix. The synthetic card rides the one exported
// builder of guide-card.stories.tsx, never a second copy.
import { View } from "react-native";

import { GuideCard } from "./guide-card";
import { syntheticCard, type GuideCardStory } from "./guide-card.stories";

// The CSF meta (the default export): the component the stories attach to.
const meta = { title: "components/guide-card-photo", component: GuideCard } as const;
export default meta;

export const photo: GuideCardStory = {
  name: "photo",
  args: {
    card: syntheticCard("free", "Сінтэтычны гід з фота"),
    photo: <View testID="synthetic-photo" style={{ backgroundColor: "#d8d2c6", flex: 1 }} />,
  },
};

// The story list of this file: every named export joins it in the same
// change (the guide-card idiom's single-source shape).
export const stories: readonly GuideCardStory[] = [photo];
