// The Italian, Finnish and Lithuanian catalogues' locale-specific rendering
// suite (EU-UI-01, issue #377). The assertions live in the shared
// ui-locale-render-suite.mjs; this file carries the wave's authored words
// (test/ui-locale-render-suite.mjs — one suite, not per-wave copies).
import { registerLocaleRenderSuite } from './ui-locale-render-suite.mjs';
import { timeCapWordsFor } from './ui-locale-time-cap-words.mjs';
import { it as webIt } from '../web/lib/i18n/it.ts';
import { fi as webFi } from '../web/lib/i18n/fi.ts';
import { lt as webLt } from '../web/lib/i18n/lt.ts';

registerLocaleRenderSuite({
  label: 'GOT 2025 wave-2',
  expected: {
    it: {
      whatToDo: 'Cosa fare →',
      aboutCity: 'Guida città',
      recenter: 'Dove sono',
      guideLink: 'Alla guida',
      paid: 'Pagamento',
      timeCapForm60: "Fino a un'ora",
      timeCapBase30: 'Fino a 30 min',
      stopsCount5: 'Tappe: 5',
      offerBuy: 'Acquista',
      ratingOf4: '4 su 5',
      guideHintHeading: "Nelle vicinanze c'è una guida…",
      selfName: 'Italiano',
      webTitle: 'Guide della città',
      webPrivacyTitle: 'Privacy',
    },
    fi: {
      whatToDo: 'Tekemistä →',
      aboutCity: 'Kaupunkiopas',
      recenter: 'Oma sijainti',
      guideLink: 'Katso opas',
      paid: 'Maksu',
      timeCapForm60: 'Enintään tunti',
      timeCapBase30: 'Enintään 30 min',
      stopsCount5: 'Kohteet: 5',
      offerBuy: 'Osta',
      ratingOf4: '4 / 5',
      guideHintHeading: 'Lähellä on opas…',
      selfName: 'Suomi',
      webTitle: 'Kaupungin oppaat',
      webPrivacyTitle: 'Tietosuoja',
    },
    lt: {
      whatToDo: 'Ką veikti →',
      aboutCity: 'Miesto gidas',
      recenter: 'Kur esu',
      guideLink: 'Į gidą',
      paid: 'Mokama',
      timeCapForm60: 'Iki valandos',
      timeCapBase30: 'Iki 30 min',
      stopsCount5: 'Sustojimai: 5',
      offerBuy: 'Pirkti',
      ratingOf4: '4 iš 5',
      guideHintHeading: 'Netoliese yra gidas…',
      selfName: 'Lietuvių',
      webTitle: 'Miesto gidai',
      webPrivacyTitle: 'Privatumas',
    },
  },
  timeCapForms: timeCapWordsFor('it', 'fi', 'lt'),
  webData: { it: webIt, fi: webFi, lt: webLt },
});
