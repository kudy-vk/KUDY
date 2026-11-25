import MapPinIcon from "lucide-react-native/icons/map-pin";
import RouteIcon from "lucide-react-native/icons/route";
import LightbulbIcon from "lucide-react-native/icons/lightbulb";
import LandmarkIcon from "lucide-react-native/icons/landmark";
import SettingsIcon from "lucide-react-native/icons/settings";

import { CityMapMenu, type PieceId } from "../docs/design/brand/outputs/menu-map-city-only/native";
import manifest from "../docs/design/brand/outputs/menu-map-city-only/manifest.json";
import { tokens } from "./design-tokens";
import { uiStrings } from "./ui-strings";

type MenuEntry = {
  id: PieceId;
  labelKey: "nearby" | "guidesLink" | "whatToDo" | "comingSoon" | "aboutCity" | "kudyLink";
  icon: typeof MapPinIcon | typeof RouteIcon | typeof LightbulbIcon | typeof LandmarkIcon | typeof SettingsIcon;
  destination: "/map" | "/city/gdansk/guides" | "/city/gdansk/about" | "/discovery" | "/my" | null;
};

// Geometry and image paths stay in the existing export; routing belongs to the host.
export const cityMenuConfig = {
  mapVersion: manifest.version,
  // Issue #216 (M11): the screen matches the approved mockup menu.html — the
  // drawing area is the mockup's square 1600×1600 canvas and the pieces sit
  // at the mockup SLOTS fractions of it (top-left = centre − half piece), so
  // the whole set fits the 5/8 band of the screen without scrolling. The
  // layout.height is also the drag bound the model clamps to.
  layout: {
    height: 1600,
    dragEnabled: true,
    centerAssembled: true,
    assembledLift: 96,
    positions: {
      nearby: { x: 153, y: 138 },
      guides: { x: 984, y: 153 },
      discovery: { x: 1006, y: 806 },
      "reserve-1": { x: 125, y: 698 },
      kudy: { x: 448, y: 1292 },
    },
  },
  // Кропка на карце, маршрут, лямпачка, «Пра горад» і KUDY-налады маюць
  // асобныя значкі. Пяты фрагмент адкрывае існуючы экран KUDY.
  items: [
    { id: "nearby", labelKey: "nearby", icon: MapPinIcon, destination: "/map" },
    { id: "guides", labelKey: "guidesLink", icon: RouteIcon, destination: "/city/gdansk/guides" },
    { id: "discovery", labelKey: "whatToDo", icon: LightbulbIcon, destination: "/discovery" },
    { id: "reserve-1", labelKey: "aboutCity", icon: LandmarkIcon, destination: "/city/gdansk/about" },
    { id: "kudy", labelKey: "kudyLink", icon: SettingsIcon, destination: "/my" },
  ] satisfies readonly MenuEntry[],
};

export function HomeMapMenu({ width, locale, onSelect }: {
  width: number;
  locale: string;
  onSelect: (id: PieceId) => void;
}) {
  const strings = uiStrings(locale);
  const labels = {} as Record<PieceId, string>;
  const items = cityMenuConfig.items.map(entry => {
    const word = strings[entry.labelKey].replace(/\s*→$/, "");
    const disabled = entry.destination === null;
    // The disabled-state suffix is retained for future unpublished pieces;
    // all five current map fragments have working destinations.
    labels[entry.id] = disabled ? `${word} · ${strings.comingSoon}` : word;
    return {
      id: entry.id,
      disabled,
      icon: entry.icon,
    };
  });
  return <CityMapMenu width={width} labels={labels} accessibilityLabels={strings.mapAccessibility} items={items} layout={cityMenuConfig.layout} onSelect={onSelect} />;
}
