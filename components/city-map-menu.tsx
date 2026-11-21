import MapPinIcon from "lucide-react-native/icons/map-pin";
import RouteIcon from "lucide-react-native/icons/route";
import LightbulbIcon from "lucide-react-native/icons/lightbulb";
import LandmarkIcon from "lucide-react-native/icons/landmark";
import HourglassIcon from "lucide-react-native/icons/hourglass";

import { CityMapMenu, type PieceId } from "../docs/design/brand/outputs/menu-map-city-only/native";
import manifest from "../docs/design/brand/outputs/menu-map-city-only/manifest.json";
import { tokens } from "./design-tokens";
import { uiStrings } from "./ui-strings";

type MenuEntry = {
  id: PieceId;
  labelKey: "nearby" | "guidesLink" | "whatToDo" | "comingSoon" | "aboutCity" | "kudyLink";
  icon: typeof MapPinIcon | typeof RouteIcon | typeof LightbulbIcon | typeof LandmarkIcon | typeof HourglassIcon;
  destination: "/map" | "/city/gdansk/guides" | "/city/gdansk/about" | "/discovery" | null;
};

// Geometry and image paths stay in the existing export; routing belongs to the host.
export const cityMenuConfig = {
  mapVersion: manifest.version,
  // Issue #216 (M11): the screen matches the approved mockup menu.html — the
  // drawing area is the mockup's square 1600×1600 canvas and the pieces sit
  // at the mockup SLOTS fractions of it (top-left = centre − half piece), so
  // the whole set fits the 5/8 band of the screen without scrolling. The
  // renderer is tap-only until MAP-11 (#84) wires drag/snap; layout.height is
  // also the drag bound the model clamps to.
  layout: {
    height: 1600,
    dragEnabled: false,
    positions: {
      nearby: { x: 153, y: 138 },
      guides: { x: 984, y: 153 },
      discovery: { x: 1006, y: 806 },
      "reserve-1": { x: 125, y: 698 },
      kudy: { x: 448, y: 1292 },
    },
  },
  // Issue #216 (M11/README verdict): кропка на карце, маршрут, лямпачка замест
  // кампаса; неактыўныя — пясочны гадзіннік. Дзве часткі не маюць аднолькавага
  // знака, акрамя неактыўных (крадзены кампас і дубляваная кропка прайшлі).
  items: [
    { id: "nearby", labelKey: "nearby", icon: MapPinIcon, destination: "/map" },
    { id: "guides", labelKey: "guidesLink", icon: RouteIcon, destination: "/city/gdansk/guides" },
    { id: "discovery", labelKey: "whatToDo", icon: LightbulbIcon, destination: "/discovery" },
    { id: "reserve-1", labelKey: "aboutCity", icon: LandmarkIcon, destination: "/city/gdansk/about" },
    { id: "kudy", labelKey: "kudyLink", icon: HourglassIcon, destination: null },
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
    // A disabled entry appends the honest «· Хутка» note; the enabled
    // guide entry (issue #200) renders its own word only. The old
    // labelKey-is-comingSoon guard died with the reserve-1 rename — no
    // disabled entry uses that labelKey any more.
    labels[entry.id] = disabled ? `${word} · ${strings.comingSoon}` : word;
    return {
      id: entry.id,
      disabled,
      icon: entry.icon,
    };
  });
  return <CityMapMenu width={width} labels={labels} items={items} layout={cityMenuConfig.layout} onSelect={onSelect} />;
}
