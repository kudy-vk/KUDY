// «Пра горад» #257: the proposal's words in Belarusian over the approved set
// (about-words-be.mjs): what the proposal changes or adds, without the
// approved keys it leaves out (DROPPED, about-257-words-en.mjs).
import { be as approved } from './about-words-be.mjs';
import { DROPPED } from './about-257-words-en.mjs';

const own = {
  'sources.title': 'Афіцыйныя спасылкі',
  'tr.residents': 'Для жыхароў Гданьска',
  'resident.title': 'Jestem z Gdańska',
  'resident.lead': 'Картка жыхара: гарадскія прапановы і транспартныя магчымасці. Білеты, льготы і ўмовы правер на афіцыйным сайце.',
  'resident.openOfficial': 'Адкрыць афіцыйны сайт: {name}',
  'card.brandAlt': 'Лагатып Gdańska Karta Turysty',
  'card.lead': 'Турыстычная картка Гданьска дапамагае наведваць музеі і іншыя цікавыя месцы паводле выбранага пакета. Транспартны білет можна набыць дадаткова — ён не ўваходзіць у асноўны пакет. Актуальныя магчымасці і ўмовы правер на афіцыйным сайце.',
  'card.openOfficial': 'Адкрыць афіцыйны сайт: {name}',
  'links.kartaTurysty': 'Karta Turysty — афіцыйныя пакеты і ўмовы',
};

export const be = Object.fromEntries(Object.entries({ ...approved, ...own }).filter(([key]) => !DROPPED.includes(key)));
