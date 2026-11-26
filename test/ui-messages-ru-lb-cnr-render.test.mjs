// The Russian, Luxembourgish and Montenegrin catalogues' locale-specific
// rendering suite (EU-UI-05, issue #394 — the languages named in
// judge-finding #384). The assertions live in the shared
// ui-locale-render-suite.mjs; this file carries the wave's authored words
// (test/ui-locale-render-suite.mjs — one suite, not per-wave copies).
import { registerLocaleRenderSuite } from './ui-locale-render-suite.mjs';
import { timeCapWordsFor } from './ui-locale-time-cap-words.mjs';
import { ru as webRu } from '../web/lib/i18n/ru.ts';
import { lb as webLb } from '../web/lib/i18n/lb.ts';
import { cnr as webCnr } from '../web/lib/i18n/cnr.ts';

registerLocaleRenderSuite({
  label: 'EU-UI-05',
  expected: {
    ru: {
      whatToDo: 'Чем заняться →',
      aboutCity: 'О городе',
      recenter: 'Где я',
      guideLink: 'К гиду',
      paid: 'Платно',
      timeCapForm60: 'До часа',
      timeCapBase30: 'До 30 мин',
      stopsCount5: 'Точки: 5',
      offerBuy: 'Купить',
      ratingOf4: '4 из 5',
      guideHintHeading: 'Рядом есть гид…',
      selfName: 'Русский',
      webTitle: 'Гиды по городу',
      webPrivacyTitle: 'Приватность',
    },
    lb: {
      whatToDo: 'Wat maachen →',
      aboutCity: "Iwwer d'Stad",
      recenter: 'Wou sinn ech',
      guideLink: 'Zum Guide',
      paid: 'Bezilt',
      timeCapForm60: 'Bis zu enger Stonn',
      timeCapBase30: 'Bis zu 30 Min',
      stopsCount5: 'Arrêten: 5',
      offerBuy: 'Kafen',
      ratingOf4: '4 vu 5',
      guideHintHeading: 'Nobie ass e Guide…',
      selfName: 'Lëtzebuergesch',
      webTitle: 'Stadguiden',
      webPrivacyTitle: 'Privatsphäre',
    },
    cnr: {
      whatToDo: 'Активности →',
      aboutCity: 'О граду',
      recenter: 'Гдје сам',
      guideLink: 'Ка водичу',
      paid: 'Плаћено',
      timeCapForm60: 'До једног сата',
      timeCapBase30: 'До 30 мин',
      stopsCount5: 'Тачке: 5',
      offerBuy: 'Купи',
      ratingOf4: '4 од 5',
      guideHintHeading: 'У близини је водич…',
      selfName: 'Црногорски',
      webTitle: 'Градски водичи',
      webPrivacyTitle: 'Приватност',
    },
  },
  timeCapForms: timeCapWordsFor('ru', 'lb', 'cnr'),
  webData: { ru: webRu, lb: webLb, cnr: webCnr },
});
