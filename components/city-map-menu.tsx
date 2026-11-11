import MapPinIcon from "lucide-react-native/icons/map-pin";
import RouteIcon from "lucide-react-native/icons/route";
import CompassIcon from "lucide-react-native/icons/compass";
import LandmarkIcon from "lucide-react-native/icons/landmark";

import { CityMapMenu, type PieceId } from "../docs/design/brand/outputs/menu-map-city-only/native";
import manifest from "../docs/design/brand/outputs/menu-map-city-only/manifest.json";
import { CanonIcon, type CanonGlyph } from "./canon-icon";
import { tokens } from "./design-tokens";
import { uiStrings, type UiStrings } from "./ui-strings";

type MenuEntry = {
  id: PieceId;
  labelKey: "nearby" | "guidesLink" | "whatToDo" | "comingSoon" | "aboutCity" | "kudyLink";
  icon: CanonGlyph;
  destination: "/map" | "/city/gdansk/guides" | "/city/gdansk/about" | "/discovery" | null;
};

// Geometry and image paths stay in the existing export; routing belongs to the host.
export const cityMenuConfig = {
  mapVersion: manifest.version,
  // The renderer is tap-only for MAP-06; drag/snap integration belongs to MAP-07/08.
  // Issue #200: the reserve-1 fragment stops being the Soon slot — it opens the
  // static «Пра горад» guide; only kudy stays reserved without a destination.
  layout: {
    height: 2500,
    dragEnabled: false,
    positions: {
      nearby: { x: 110, y: 600 },
      guides: { x: 990, y: 330 },
      discovery: { x: 970, y: 1150 },
      "reserve-1": { x: 90, y: 1300 },
      kudy: { x: 530, y: 2150 },
    },
  },
  items: [
    { id: "nearby", labelKey: "nearby", icon: MapPinIcon, destination: "/map" },
    { id: "guides", labelKey: "guidesLink", icon: RouteIcon, destination: "/city/gdansk/guides" },
    { id: "discovery", labelKey: "whatToDo", icon: CompassIcon, destination: "/discovery" },
    { id: "reserve-1", labelKey: "aboutCity", icon: LandmarkIcon, destination: "/city/gdansk/about" },
    { id: "kudy", labelKey: "kudyLink", icon: CompassIcon, destination: null },
  ] satisfies readonly MenuEntry[],
};

export function HomeMapMenu({ width, locale, onSelect }: {
  width: number;
  locale: string;
  onSelect: (id: PieceId) => void;
}) {
  const strings: UiStrings = uiStrings(locale);
  const labels = {} as Record<PieceId, string>;
  const items = cityMenuConfig.items.map(entry => {
    const word = strings[entry.labelKey].replace(/\s*→$/, "");
    const disabled = entry.destination === null;
    // A disabled entry appends the honest «· Хутка» note; the enabled
    // guide entry (issue #200) renders its own word only. The old
    // labelKey-is-comingSoon guard died with the reserve-1 rename — no
    // disabled entry uses that labelKey any more.
    const label = disabled ? `${word} · ${strings.comingSoon}` : word;
    labels[entry.id] = label;
    return {
      id: entry.id,
      disabled,
      icon: <CanonIcon glyph={entry.icon} label={label} color={disabled ? tokens.colorDisabledInk : tokens.colorAccent} />,
    };
  });
  return <CityMapMenu width={width} labels={labels} items={items} layout={cityMenuConfig.layout} labelStyle={{ fontFamily: tokens.fontFamilyUi }} onSelect={onSelect} />;
}
