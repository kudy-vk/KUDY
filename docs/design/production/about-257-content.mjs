// «Пра горад» #257: the proposal's facts and the access to its words, over the
// approved ones (about-content.mjs). The card-and-museums section leaves the
// wheel (the tourist card moves into the airport section) and the resident
// card joins transport; vendor prices and changing offers stay on official
// sites. These are proposals: they enter contracts/ui-messages after the verdict.
import { LINKS as APPROVED_LINKS, SECTIONS as APPROVED_SECTIONS, guideWords } from './about-content.mjs';
import { be } from './about-257-words-be.mjs';
import { en } from './about-257-words-en.mjs';

// The museum pages left with the card-and-museums section; the tourist card
// opens its packages page instead of the price list; the resident card links
// its own official site.
const { muzeumGdanska, muzeum1939, ...links } = APPROVED_LINKS;
export const LINKS = {
  ...links,
  kartaTurysty: 'https://kartaturysty.visitgdansk.com/pl/pakiety',
  jestemZGdanska: 'https://jestemzgdanska.pl/',
};

// Official asset from the card organiser. In the mockup this uses the live
// URL with a text fallback; rights/offline bundling need separate approval.
export const TOURIST_CARD_LOGO = 'https://kartaturysty.visitgdansk.com/cmsImages/logoAplikacji.png';

// The wheel without the card-and-museums section.
export const SECTIONS = APPROVED_SECTIONS.filter((section) => section.id !== 'card');

export const { hasText, guideLanguage, translator } = guideWords({ en, be });
