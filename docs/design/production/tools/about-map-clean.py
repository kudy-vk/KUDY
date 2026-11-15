# Makes the base picture of the «Пра горад» map (../about-map.webp) from the
# owner's target screen for #248 (about-map-source.png, a drawn screen of the
# section with a readable map of the Tricity).
#
# It cuts the map out of the screen and removes what the app now draws itself
# and makes pressable: the painted rail lines, the station rings, the dashed
# planned line and the coloured zone patches. The patches are translucent
# washes, so they are taken off by undoing the wash colour pixel by pixel; the
# lines and rings are filled in from their surroundings. Map names, roads,
# water, road numbers and the airport sign stay. The pixel positions below
# belong to this one source picture.
#
# Needs Python 3 with numpy and opencv-python. From the repository root:
#   python docs/design/production/tools/about-map-clean.py \
#     docs/design/production/tools/about-map-source.png docs/design/production/about-map.webp
import sys

import cv2
import numpy as np

source, target = sys.argv[1], sys.argv[2]
screen = cv2.imread(source)
if screen is None or screen.shape[:2] != (1672, 941):
    sys.exit(f'{source}: expected the 941 x 1672 px source screen')

X0, Y0, X1, Y1 = 24, 537, 916, 1508  # the map card on the screen
image = screen[Y0:Y1, X0:X1].copy()
H, W = image.shape[:2]
f = image.astype(np.float32)
b, g, r = f[..., 0], f[..., 1], f[..., 2]
disc = lambda size: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))

def components(mask, min_area):
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    keep = np.zeros_like(mask)
    for i in range(1, count):
        if stats[i, 4] > min_area:
            keep[labels == i] = 1
    return keep

# Road number plates stay as they are.
plate = cv2.morphologyEx(((r > 200) & (g > 165) & (b < 120) & (r - b > 90)).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
count, _, stats, _ = cv2.connectedComponentsWithStats(plate)
plates = np.zeros_like(plate)
for x, y, w, h, area in stats[1:]:
    if area > 150 and 18 < w < 60 and 12 < h < 40:
        cv2.rectangle(plates, (x - 3, y - 3), (x + w + 3, y + h + 3), 1, -1)

# 1. Rail lines (dark green), the dashed planned line (olive) and the station rings.
line = (g > r + 30) & (g < 175) & (r < 135) & (b < g)
olive = (r > 70) & (r < 175) & (g > 95) & (g < 185) & (b < 100) & (np.abs(g - r) < 45) & (g >= r - 8)
rail = (line | olive).astype(np.uint8)
rail &= components(cv2.dilate(rail, np.ones((5, 5), np.uint8)), 150)
RINGS = [(355.2, 610.5), (396.9, 689.5), (386.8, 774.1), (399.2, 860.6), (431.5, 951.6), (446.1, 1021.4), (452.2, 1078.9),
         (421.8, 1104.4), (407.0, 1162.3), (344.3, 1192.2), (504.8, 1132.0), (583.7, 1201.7), (580.2, 1268.3),
         (505.1, 1351.0), (431.5, 1405.8), (377.0, 1436.7)]  # on the screen, px
for cx, cy in RINGS:
    cv2.circle(rail, (round(cx - X0), round(cy - Y0)), 11, 1, -1)
rail = cv2.dilate(rail, disc(11))
rail[plates == 1] = 0
cv2.circle(rail, (250, 620), 17, 0, -1)  # the airport sign stays

# The card's rounded corners and border.
R = 26
card = np.zeros_like(rail)
cv2.rectangle(card, (R, 0), (W - 1 - R, H - 1), 1, -1)
cv2.rectangle(card, (0, R), (W - 1, H - 1 - R), 1, -1)
for cx, cy in [(R, R), (W - 1 - R, R), (R, H - 1 - R), (W - 1 - R, H - 1 - R)]:
    cv2.circle(card, (cx, cy), R, 1, -1)
border = np.zeros_like(rail)
cv2.rectangle(border, (0, 0), (W - 1, H - 1), 1, 3)
border |= cv2.dilate((card == 0).astype(np.uint8), np.ones((5, 5), np.uint8))

# 2. Orange patches: a translucent orange wash; its strength follows from how
# much warmer than the paper a pixel is.
orange = (((r > 215) & ((r - b) > 55) & (b > 95) & (g < 218) & (g > 150))
          | ((r > 165) & ((r - b) > 45) & (b > 80) & (g > 150) & (g < 215) & (r >= g - 12))).astype(np.uint8)
orange_area = cv2.dilate(components(orange, 120), disc(15))
orange_wash = np.clip(((r - b) - 16) / (170 - 16), 0, 0.62) * orange_area

# 3. Green patches: a translucent green wash over mixed ground, feathered at the edge.
green = ((g > r + 10) & (g < 224) & (r > 120) & ((g - b) > 25)).astype(np.uint8)
green_area = components(cv2.morphologyEx(green, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)), 1500)
green_area = cv2.dilate(cv2.morphologyEx(green_area, cv2.MORPH_CLOSE, disc(21)), disc(9))
green_wash = cv2.GaussianBlur(green_area.astype(np.float32), (0, 0), 5) * 0.33

out = f.copy()
dark = (f.mean(-1) < 120)[..., None]  # names and other dark ink keep their colour
for wash, colour in [(orange_wash, np.array([70, 160, 240], np.float32)), (green_wash, np.array([80, 180, 110], np.float32))]:
    a = wash[..., None]
    out = np.where((a > 0.01) & ~dark, (out - a * colour) / (1 - a), out)
out = np.clip(out, 0, 255).astype(np.uint8)
out = cv2.inpaint(out, ((rail | border) > 0).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)

# 4. What the washes left: vivid green or orange specks inside the old patches.
o = out.astype(np.int32)
ob, og, orr = o[..., 0], o[..., 1], o[..., 2]
patches = cv2.dilate(((orange_area | green_area) > 0).astype(np.uint8), np.ones((9, 9), np.uint8))
light = o.mean(-1) > 150
left_green = (((og - orr) > 32) & (og > ob + 15) & (orr > 90) & (og < 218)) & light
left = (left_green | ((((orr - ob) > 55) & (ob > 60) & (orr > 170)) & light)) & (patches > 0) & (plates == 0)
left = cv2.dilate(left.astype(np.uint8), disc(5))
median = cv2.medianBlur(out, 21)
paper = np.array([228, 236, 242], np.uint8)
out = np.where(left[..., None] > 0, np.where((median.mean(-1) > 190)[..., None], median, paper), out)
forest = cv2.dilate((left_green & (patches > 0) & (plates == 0)).astype(np.uint8), disc(5))[..., None] > 0
out = np.where(forest, np.array([184, 228, 198], np.uint8), out)
out = np.where(forest, cv2.GaussianBlur(out, (3, 3), 0), out)

cv2.imwrite(target, out, [cv2.IMWRITE_WEBP_QUALITY, 90])
print(f'{target}: {W} x {H} px')
