// «Пра горад» #257: the proposal's words in English over the approved set
// (about-words-en.mjs, the full set and the fallback for every interface
// language without words of its own). Only what the proposal changes or adds
// lives here, and the approved keys it leaves out: the card-and-museums
// section (its card now sits in the airport section), the prices, the dated
// notices. about-257-content.mjs checks the Belarusian set key for key.
import { en as approved } from './about-words-en.mjs';

export const DROPPED = [
  'tab.card', 'head.card', 'verified', 'sources.note', 'tk.night', 'air.notice', 'card.duration',
  'card.hours', 'card.odkrywca.entries', 'card.odkrywca.list', 'card.premium.entries',
  'card.premium.list', 'card.smaki', 'card.transport.title', 'card.transport.meta',
  'card.transport.text', 'card.free', 'card.day', 'card.free.badge', 'card.closed.badge',
  'museum.gdanska', 'museum.ww2', 'card.mon.gdanska', 'card.mon.ww2', 'card.tue.ww2',
  'card.tue.gdanska', 'card.other', 'day.1', 'day.2', 'day.3', 'day.4', 'day.5', 'day.6', 'day.7',
  'u.decimal', 'card.notice', 'links.muzeumGdanska', 'links.muzeum1939',
];

const own = {
  'sources.title': 'Official links',
  'tr.residents': 'For Gdańsk residents',
  'resident.title': 'Jestem z Gdańska',
  'resident.lead': 'The resident card offers city benefits and transport-related services. Check current tickets, eligibility and terms on the official website.',
  'resident.openOfficial': 'Open official website: {name}',
  'card.brandAlt': 'Gdańska Karta Turysty logo',
  'card.lead': 'Gdańsk’s tourist card gives access to museums and other attractions included in the chosen package. A transport ticket can be purchased separately and is not part of the main package. Check current options and terms on the official website.',
  'card.openOfficial': 'Open official website: {name}',
  'links.kartaTurysty': 'Karta Turysty — official packages and terms',
};

export const en = Object.fromEntries(Object.entries({ ...approved, ...own }).filter(([key]) => !DROPPED.includes(key)));
