// Issue #252 — the building blocks of a «Пра горад» guide section, the typed
// port of the mockup's about-parts.mjs (docs/design/production/, #202
// approved 2026-11-12): they turn facts into things to scan and press
// instead of paragraphs — a fold, a switch, numbered steps, a line badge,
// fact signs, price rows, detail rows, a remark, a tile. Styles follow the
// mockup's about.html on the canon tokens; the two apr rules ride the shared
// idioms: every pressable goes through PressableSurface (the pressed dim,
// the 48 dp floor) and every text through ScaledText (the big-text cap).
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import ChevronDownIcon from "lucide-react-native/icons/chevron-down";
import CircleAlertIcon from "lucide-react-native/icons/circle-alert";
import LightbulbIcon from "lucide-react-native/icons/lightbulb";
import TriangleAlertIcon from "lucide-react-native/icons/triangle-alert";

import { CanonIcon, type CanonGlyph } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import { useThemeStyles } from "./theme";

// A small heading inside a section.
export function SubHeading({ children }: { children: ReactNode }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return <ScaledText style={styles.subHeading}>{children}</ScaledText>;
}

// A switch between a few values, drawn like the theme switch of the
// settings. options: [key, label]; value: the checked key. `name` — the
// switch's own name inside the screen, the stable testID stem.
export function Seg({ name, label, options, value, onChange }: {
  name: string;
  label: string;
  options: readonly (readonly [key: string, label: string])[];
  value: string;
  onChange: (key: string) => void;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View accessibilityLabel={label} accessibilityRole="radiogroup" style={styles.seg}>
      {options.map(([key, optionLabel]) => (
        <PressableSurface
          accessibilityRole="radio"
          accessibilityLabel={optionLabel}
          accessibilityState={{ checked: key === value }}
          key={key}
          onPress={() => onChange(key)}
          style={[styles.segButton, key === value ? styles.segChecked : null]}
          testID={`seg-${name}-${key}`}
        >
          <ScaledText style={[styles.segText, key === value ? styles.segCheckedText : null]}>
            {optionLabel}
          </ScaledText>
        </PressableSurface>
      ))}
    </View>
  );
}

// Numbered steps joined by a line. items: [title, body].
export function Steps({ items }: { items: readonly (readonly [title: string, body: ReactNode])[] }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View>
      {items.map(([title, body], i) => (
        <View key={title} style={[styles.step, i === items.length - 1 ? null : styles.stepSpaced]}>
          <View style={styles.stepNumberBox}>
            <ScaledText style={styles.stepNumber}>{i + 1}</ScaledText>
            {i === items.length - 1 ? null : <View style={styles.stepLine} />}
          </View>
          <View style={styles.stepBody}>
            <ScaledText style={styles.stepTitle}>{title}</ScaledText>
            {body}
          </View>
        </View>
      ))}
    </View>
  );
}

// The number of a line as a plate: a bus, a night bus or a train.
export function LineBadge({ kind, line, kindName }: {
  kind: "bus" | "night" | "train";
  line: string;
  // The ride kind's word for the screen reader, read before the number.
  kindName: string;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View accessible accessibilityLabel={`${kindName} ${line}`} style={[styles.linePlate, styles[`line_${kind}`]]}>
      <ScaledText style={[styles.lineText, styles[`lineText_${kind}`]]}>{line}</ScaledText>
    </View>
  );
}

// Short facts with a sign each.
export function Facts({ items }: { items: readonly (readonly [sign: CanonGlyph, text: string])[] }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View style={styles.facts}>
      {items.map(([sign, text], i) => (
        <View key={`${text}-${i}`} style={styles.fact}>
          <CanonIcon glyph={sign} label={text} size={16} style={styles.factIcon} />
          <ScaledText style={styles.factText}>{text}</ScaledText>
        </View>
      ))}
    </View>
  );
}

// Label-and-value rows.
export function DetailRows({ rows }: { rows: readonly (readonly [label: string, value: string])[] }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View style={styles.detailRows}>
      {rows.map(([label, value]) => (
        <View key={label}>
          <ScaledText style={styles.detailLabel}>{label}</ScaledText>
          <ScaledText style={styles.detailValue}>{value}</ScaledText>
        </View>
      ))}
    </View>
  );
}

// Price rows: [name, price, reduced price or null]. One list, one shape: if
// any price has grosze, every price shows them (the caller pre-renders).
export function PriceRows({ rows }: { rows: readonly (readonly [name: string, price: string, reduced: string | null])[] }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View>
      {rows.map(([name, price, reduced]) => (
        <View key={name} style={styles.priceRow}>
          <ScaledText style={styles.priceName}>{name}</ScaledText>
          <View style={styles.priceValue}>
            <ScaledText style={styles.priceSum}>{price}</ScaledText>
            {reduced ? <ScaledText style={styles.priceReduced}>{reduced}</ScaledText> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// A remark: `warn` for what may spoil a trip, `tip` for a useful extra,
// `error` for a failure.
const REMARK_GLYPHS = {
  warn: TriangleAlertIcon,
  tip: LightbulbIcon,
  error: CircleAlertIcon,
} as const;

export function Remark({ tone, text }: { tone: "warn" | "tip" | "error"; text: string }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View
      accessibilityLiveRegion={tone === "error" ? "polite" : undefined}
      style={[styles.remark, styles[`remark_${tone}`]]}
      testID={`remark-${tone}`}
    >
      <CanonIcon glyph={REMARK_GLYPHS[tone]} label={text} size={18} color={tone === "tip" ? tokens.colorAccent : undefined} style={styles.remarkIcon} />
      <ScaledText style={styles.remarkText}>{text}</ScaledText>
    </View>
  );
}

// A fold: a head that is always visible and a body that opens under it.
// A group keeps one fold open: opening one closes the others (the mockup's
// folds() rule), so the list never grows into a wall of text.
export function Fold({ id, open, lead, title, meta, body, onToggle }: {
  id: string;
  open: boolean;
  lead?: ReactNode;
  title: string;
  // The muted line under the title — a word or a facts row (the ride cards).
  meta?: ReactNode;
  body: ReactNode;
  onToggle: (id: string, open: boolean) => void;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View style={styles.fold}>
      <PressableSurface
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={() => onToggle(id, !open)}
        style={styles.foldHead}
        testID={`fold-${id}`}
      >
        {lead}
        <View style={styles.foldTitle}>
          <ScaledText style={styles.foldName}>{title}</ScaledText>
          {typeof meta === "string" ? <ScaledText style={styles.foldMeta}>{meta}</ScaledText> : meta}
        </View>
        <View style={[styles.foldChevron, open ? styles.foldChevronOpen : null]} pointerEvents="none">
          <CanonIcon glyph={ChevronDownIcon} label={title} size={20} />
        </View>
      </PressableSurface>
      {open ? <View style={styles.foldBody}>{body}</View> : null}
    </View>
  );
}

// A tile with a sign, a name and one line of text.
export function Tile({ glyph, title, text }: { glyph: CanonGlyph; title: string; text: string }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View style={styles.tile}>
      <CanonIcon glyph={glyph} label={title} size={20} color={tokens.colorAccent} style={styles.tileIcon} />
      <ScaledText style={styles.tileTitle}>{title}</ScaledText>
      <ScaledText style={styles.tileText}>{text}</ScaledText>
    </View>
  );
}

// The label-to-id helper keeps testIDs stable across locales.
function labelToId(label: string): string {
  return label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  subHeading: {
    color: palette.colorMuted,
    fontSize: 13,
    marginTop: 12,
  },
  seg: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    padding: 4,
  },
  segButton: {
    alignItems: "center",
    borderRadius: 7,
    flexGrow: 1,
    flexBasis: "30%",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  segChecked: {
    backgroundColor: palette.colorAccent,
  },
  segText: {
    color: palette.colorInk,
    fontSize: 14,
    lineHeight: 17,
    textAlign: "center",
  },
  segCheckedText: {
    color: palette.colorAccentInk,
  },
  step: {
    columnGap: 12,
    flexDirection: "row",
  },
  stepSpaced: {
    marginBottom: 20,
  },
  stepNumberBox: {
    alignItems: "center",
    alignSelf: "stretch",
    width: 32,
  },
  stepNumber: {
    alignItems: "center",
    borderColor: palette.colorAccent,
    borderRadius: 16,
    borderWidth: 2,
    color: palette.colorAccent,
    fontSize: 15,
    fontWeight: tokens.fontWeightStrong,
    height: 32,
    lineHeight: 28,
    textAlign: "center",
    width: 32,
  },
  stepLine: {
    backgroundColor: palette.colorLine,
    flexGrow: 1,
    marginTop: 4,
    width: 2,
  },
  stepBody: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  stepTitle: {
    color: palette.colorInk,
    fontSize: 17,
    fontWeight: tokens.fontWeightStrong,
    lineHeight: 22,
  },
  linePlate: {
    alignItems: "center",
    borderRadius: tokens.radiusBase,
    justifyContent: "center",
    maxHeight: 36,
    minHeight: 36,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  line_bus: {
    backgroundColor: palette.colorAccent,
  },
  line_night: {
    backgroundColor: palette.colorInk,
  },
  line_train: {
    borderColor: palette.colorAccent,
    borderWidth: 2,
  },
  lineText: {
    fontSize: 15,
    fontWeight: tokens.fontWeightStrong,
  },
  lineText_bus: {
    color: palette.colorAccentInk,
  },
  lineText_night: {
    color: palette.colorPaper,
  },
  lineText_train: {
    color: palette.colorAccent,
    fontSize: 12,
  },
  facts: {
    columnGap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
  },
  fact: {
    columnGap: 4,
    flexDirection: "row",
    minWidth: 0,
  },
  factIcon: {
    marginTop: 1,
  },
  factText: {
    color: palette.colorMuted,
    flexShrink: 1,
    fontSize: 13,
  },
  detailRows: {
    gap: 10,
  },
  detailLabel: {
    color: palette.colorMuted,
    fontSize: 12,
  },
  detailValue: {
    color: palette.colorInk,
    fontSize: 16,
  },
  priceRow: {
    borderTopColor: palette.colorLine,
    borderTopWidth: StyleSheet.hairlineWidth,
    columnGap: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  priceName: {
    color: palette.colorInk,
    flexShrink: 1,
    fontSize: 16,
  },
  priceValue: {
    alignItems: "flex-end",
  },
  priceSum: {
    color: palette.colorInk,
    fontSize: 16,
    fontWeight: tokens.fontWeightStrong,
  },
  priceReduced: {
    color: palette.colorMuted,
    fontSize: 12,
  },
  remark: {
    borderRadius: tokens.radiusBase,
    columnGap: 8,
    flexDirection: "row",
    padding: 12,
  },
  remark_warn: {
    backgroundColor: palette.colorNoticeBg,
    borderColor: palette.colorNoticeBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
  remark_tip: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderWidth: StyleSheet.hairlineWidth,
  },
  remark_error: {
    backgroundColor: palette.colorErrorBg,
    borderColor: palette.colorErrorBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
  remarkIcon: {
    marginTop: 2,
  },
  remarkText: {
    color: palette.colorInk,
    flexShrink: 1,
    fontSize: 14,
  },
  fold: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  foldHead: {
    alignItems: "center",
    columnGap: 12,
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  foldTitle: {
    flex: 1,
    minWidth: 0,
  },
  foldName: {
    color: palette.colorInk,
    fontSize: 16,
    fontWeight: tokens.fontWeightStrong,
  },
  foldMeta: {
    color: palette.colorMuted,
    fontSize: 13,
  },
  foldChevron: {
    transform: [{ rotate: "0deg" }],
  },
  foldChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  foldBody: {
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  tile: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: 130,
    flexGrow: 1,
    gap: 4,
    padding: 12,
  },
  tileIcon: {
    marginBottom: 2,
  },
  tileTitle: {
    color: palette.colorInk,
    fontSize: 14,
    fontWeight: tokens.fontWeightStrong,
  },
  tileText: {
    color: palette.colorMuted,
    fontSize: 13,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);
