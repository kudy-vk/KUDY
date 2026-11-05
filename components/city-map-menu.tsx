import MapPinIcon from "lucide-react-native/icons/map-pin";
import RouteIcon from "lucide-react-native/icons/route";
import CompassIcon from "lucide-react-native/icons/compass";
import ClockIcon from "lucide-react-native/icons/clock";

import { CityMapMenu, type PieceId } from "../docs/design/brand/outputs/menu-map-city-only/native";
import manifest from "../docs/design/brand/outputs/menu-map-city-only/manifest.json";
import { CanonIcon, type CanonGlyph } from "./canon-icon";
import { tokens } from "./design-tokens";
import { uiStrings, type UiStrings } from "./ui-strings";

type MenuEntry = {
  id: PieceId;
  labelKey: "nearby" | "guidesLink" | "whatToDo" | "comingSoon" | "kudyLink";
  icon: CanonGlyph;
  destination: "/map" | "/city/gdansk/guides" | "/discovery" | null;
};

// Geometry and image paths stay in the existing export; routing belongs to the host.
export const cityMenuConfig = {
  mapVersion: manifest.version,
  // The renderer is tap-only for MAP-06; drag/snap integration belongs to MAP-07/08.
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
    { id: "reserve-1", labelKey: "comingSoon", icon: ClockIcon, destination: null },
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
    const label = disabled && entry.labelKey !== "comingSoon" ? `${word} · ${strings.comingSoon}` : word;
    labels[entry.id] = label;
    return {
      id: entry.id,
      disabled,
      icon: <CanonIcon glyph={entry.icon} label={label} color={disabled ? tokens.colorDisabledInk : tokens.colorAccent} />,
    };
  });
  return <CityMapMenu width={width} labels={labels} items={items} layout={cityMenuConfig.layout} labelStyle={{ fontFamily: tokens.fontFamilyUi }} onSelect={onSelect} />;
}
