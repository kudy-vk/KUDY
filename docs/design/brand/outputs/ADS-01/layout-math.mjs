// ADS-01 (#988): dp layout math for a home-screen banner between the menu map
// (CityMapMenu, 9:8 block) and the future footer image (#990). Proposal only -
// no production layout is changed by this file.
//
// Size rules verified 2026-11-02 against the official GMA AdSize reference
// (developers.google.com/ad-manager/mobile-ads-sdk/android/reference/com/google/android/gms/ads/AdSize):
// - anchored adaptive (legacy): height <= 15% of the device's current
//   orientation height, never smaller than 50dp; deprecated by GMA SDK 25.0.0
//   (2026-02-19, ads-developers.googleblog.com) in favour of large anchored.
// - large anchored adaptive: 50..150dp, height <= 20% of screen height,
//   "designed for non-scrolling layouts".
// - inline adaptive: developer-chosen maxHeight >= 32dp (50dp+ recommended),
//   variable height, "can be as tall as the device screen".
// The SDK returns one deterministic height per width+device; this module
// models the legal envelope [floor..cap] - not a promised SDK value.

export const MAP_ASPECT = 1.125; // CityMapMenu host: height = width * 1.125
export const CANVAS_W = 1600;
export const CANVAS_H = 1800;
export const PIECE_BASE_X = 125; // scene group translate in CityMapMenu.tsx
export const PIECE_BASE_Y = 320;
export const LABEL_ABOVE_DP = 48; // piece label sits 48dp above its top edge
export const GAP = 8; // design token spaceS

export const BANNER_FAMILIES = {
  anchored: { floor: 50, capRatio: 0.15, capAbs: null, label: 'anchored adaptive (legacy, deprecated 2026-02-19)' },
  anchoredLarge: { floor: 50, capRatio: 0.2, capAbs: 150, label: 'large anchored adaptive (GMA 25.0.0+)' },
  inline: { floor: 32, capRatio: 1, capAbs: null, label: 'inline adaptive (maxHeight-chosen)' },
};

// Representative Android phones in dp. Insets are status-bar and navigation
// heights of common configurations; per-device values are NOT-VERIFIED.
export const DEVICES = [
  { id: '320x640-3btn', width: 320, height: 640, top: 24, bottom: 48 },
  { id: '360x800-3btn', width: 360, height: 800, top: 24, bottom: 48 },
  { id: '360x800-gesture', width: 360, height: 800, top: 24, bottom: 16 },
  { id: '390x844-gesture', width: 390, height: 844, top: 47, bottom: 34 },
  { id: '430x932-gesture', width: 430, height: 932, top: 47, bottom: 34 },
];

export function bannerEnvelope(family, device) {
  const rule = BANNER_FAMILIES[family];
  if (!rule) throw new Error('unknown banner family: ' + family);
  const cap = Math.min(Math.floor(device.height * rule.capRatio), rule.capAbs ?? Infinity);
  return { floor: rule.floor, cap };
}

export function mapHeight(widthDp) {
  return widthDp * MAP_ASPECT;
}

// Piece rectangles in the 1600x1800 canvas space, scattered state:
// CityMapMenu draws each piece at (PIECE_BASE + piece.x, PIECE_BASE + piece.y).
export function pieceRects(nativeLayout) {
  return nativeLayout.pieces.map((p) => ({
    id: p.id,
    x: PIECE_BASE_X + p.x,
    y: PIECE_BASE_Y + p.y,
    w: p.width,
    h: p.height,
  }));
}

// variant 'packed': map, gap, banner, gap, footer, free space below the footer.
// variant 'bottom-anchored': map at the top; banner and footer pinned above the
// bottom inset; the free space sits between the map and the banner.
export function layout(device, { variant, family, bannerHeight, footerHeight }) {
  const envelope = bannerEnvelope(family, device);
  if (bannerHeight < envelope.floor) throw new Error('banner below the official floor');
  if (bannerHeight > envelope.cap) throw new Error('banner above the official cap');
  const top = device.top;
  const bottom = device.bottom;
  const mH = mapHeight(device.width);
  const mapBottom = top + mH;
  let bannerTop;
  if (variant === 'packed') {
    bannerTop = mapBottom + GAP;
  } else if (variant === 'bottom-anchored') {
    bannerTop = device.height - bottom - footerHeight - bannerHeight;
  } else {
    throw new Error('unknown variant: ' + variant);
  }
  const bannerRect = { top: bannerTop, height: bannerHeight, bottom: bannerTop + bannerHeight };
  const footerRect = { top: bannerRect.bottom, height: footerHeight, bottom: bannerRect.bottom + footerHeight };
  const mapBannerGap = bannerTop - mapBottom; // may go negative -> overlap
  const overlapsMap = mapBannerGap < GAP;
  const freeSpace =
    variant === 'packed'
      ? device.height - bottom - (footerRect.bottom)
      : mapBannerGap - GAP;
  return {
    mapH: mH,
    mapBottom,
    bannerRect,
    footerRect,
    mapBannerGap,
    overlapsMap,
    overflow: freeSpace < 0,
    freeSpace,
    bannerAboveFold: bannerRect.bottom <= device.height,
  };
}

// Intersection in dp between a rectangle and the scaled piece/label rectangles
// of the map. The rect carries x/width (the proposal banner spans the full
// device width, but the check stays two-dimensional). Labels extend
// LABEL_ABOVE_DP above each piece top edge.
export function touchOverlap(rect, pieceRects, scale, mapTop) {
  const scaled = pieceRects.map((p) => ({
    id: p.id,
    x: p.x * scale,
    y: mapTop + p.y * scale - LABEL_ABOVE_DP,
    w: p.w * scale,
    h: p.h * scale + LABEL_ABOVE_DP,
  }));
  return scaled
    .filter(
      (p) =>
        rect.top < p.y + p.h &&
        p.y < rect.top + rect.height &&
        rect.x < p.x + p.w &&
        p.x < rect.x + rect.width,
    )
    .map((p) => p.id);
}
