// Shared engraved Old Town paths from the accepted #257 route cards.
import { ICONS } from "./kit-icons.mjs";
export const PLANE_PATH = ICONS.plane[0][1].d;
const needle = (x, y, w, h) => `M${x - w / 2} ${y}L${x} ${y - h}L${x + w / 2} ${y}Z`;
const box = (x0, y0, x1, y1) => `M${x0} ${y1}V${y0}H${x1}V${y1}Z`;
export const OLD_TOWN = [
  ['mass', box(55, 34, 77, 92) + 'M52 34L58 25H74L80 34Z'],
  ['fine', 'M59.5 40v12M63.5 40v12M68.5 40v12M72.5 40v12M59.5 58v12M63.5 58v12M68.5 58v12M72.5 58v12M55 55h22'],
  ['mass', box(33, 52, 47, 92) + box(34, 43, 46, 52) + needle(34, 43, 3, 7) + needle(46, 43, 3, 7) + box(36, 35, 44, 43) + 'M37 35Q37 29 40 27Q43 29 43 35Z' + needle(40, 27, 2.4, 20)],
  ['fine', 'M36 60v10M40 60v10M44 60v10M35 35h10M38 31h4'],
  ['ink', 'M37.4 47.5a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0M40 46v1.5l1 .8'],
  ['mass', box(19, 42, 23, 56) + 'M18.5 42L21 38L23.5 42Z'],
  ['mass', 'M9 70L21 50L33 70Z' + box(11, 70, 31, 92)],
  ['mass', box(83, 62, 88, 80) + needle(85.5, 62, 5, 15)],
  ['mass', 'M20 92V77L23 74V71L26 71V68L29 68V65L32 65L35 68V71L38 71V74L41 77V92Z'],
  ['mass', 'M41 92V79L47.5 70L54 79V92Z'],
  ['mass', 'M54 92V77Q54 70 60 68Q66 70 66 77V92Z'],
  ['mass', 'M66 92V75L72.5 66L79 75V92Z' + needle(72.5, 66, 1.6, 4)],
  ['mass', 'M79 92V79L84.5 73L90 79V92Z'],
  ['fine', 'M25 80h3v4h-3zM33 80h3v4h-3zM25 86h3v4h-3zM33 86h3v4h-3zM45 82h2.5v4H45zM48 82h2.5v4H48zM58 80h4v4h-4zM58 86h4v4h-4zM69 79h2.5v4H69zM74 79h2.5v4H74zM69 85h2.5v4H69zM74 85h2.5v4H74zM83 83h3v4h-3z'],
  ['mass', 'M6 92Q5 85 11 85Q13 81 17 84Q22 84 21 92Z' + 'M44 92Q44 87 49 87Q53 85 55 89Q57 92 56 92Z' + 'M86 92Q86 86 91 86Q96 85 96 92Z'],
  ['ink', 'M3 92H97'],
];

