// The Icelandic, Irish, Maltese, Catalan and Turkish catalogues' locale-
// specific rendering suite (EU-UI-04, issue #380). The assertions live in the
// shared ui-locale-render-suite.mjs; this file carries the wave's authored
// words (test/ui-locale-render-suite.mjs — one suite, not per-wave copies).
import { registerLocaleRenderSuite } from './ui-locale-render-suite.mjs';
import { timeCapWordsFor } from './ui-locale-time-cap-words.mjs';
import { is as webIs } from '../web/lib/i18n/is.ts';
import { ga as webGa } from '../web/lib/i18n/ga.ts';
import { mt as webMt } from '../web/lib/i18n/mt.ts';
import { ca as webCa } from '../web/lib/i18n/ca.ts';
import { tr as webTr } from '../web/lib/i18n/tr.ts';

registerLocaleRenderSuite({
  label: 'EU-UI-04',
  expected: {
    is: {
      whatToDo: 'Afþreying →',
      aboutCity: 'Um borgina',
      recenter: 'Hvar er ég',
      guideLink: 'Skoða leiðsögn',
      paid: 'Gjald',
      timeCapForm60: 'Allt að eina klukkustund',
      timeCapBase30: 'Allt að 30 mín',
      stopsCount5: 'Stöðvar: 5',
      offerBuy: 'Kaupa',
      ratingOf4: '4 af 5',
      guideHintHeading: 'Nálægt er leiðsögn…',
      selfName: 'Íslenska',
      webTitle: 'Borgarleiðsagnir',
      webPrivacyTitle: 'Persónuvernd',
    },
    ga: {
      whatToDo: 'Gníomhaíochtaí →',
      aboutCity: 'Faoin gcathair',
      recenter: 'Cá bhfuil mé',
      guideLink: 'Go dtí an treoir',
      paid: 'Íoctha',
      timeCapForm60: 'Suas le uair an chloig',
      timeCapBase30: 'Suas le 30 nóim',
      stopsCount5: 'Stadanna: 5',
      offerBuy: 'Ceannaigh',
      ratingOf4: '4 as 5',
      guideHintHeading: 'Tá treoir in aice…',
      selfName: 'Gaeilge',
      webTitle: 'Treoracha na cathrach',
      webPrivacyTitle: 'Príobháideachas',
    },
    mt: {
      whatToDo: 'Attivitajiet →',
      aboutCity: 'Dwar il-belt',
      recenter: 'Fejn jien',
      guideLink: 'Għall-gwida',
      paid: 'Mħallas',
      timeCapForm60: 'Sakemm siegħa',
      timeCapBase30: 'Sakemm 30 min',
      stopsCount5: 'Waqfiet: 5',
      offerBuy: 'Ixtri',
      ratingOf4: '4 minn 5',
      guideHintHeading: 'Fil-qrib hemm gwida…',
      selfName: 'Malti',
      webTitle: 'Gwidi tal-belt',
      webPrivacyTitle: 'Privatezza',
    },
    ca: {
      whatToDo: 'Què fer →',
      aboutCity: 'Sobre la ciutat',
      recenter: 'On sóc',
      guideLink: 'A la guia',
      paid: 'Pagament',
      timeCapForm60: 'Fins a una hora',
      timeCapBase30: 'Fins a 30 min',
      stopsCount5: 'Aturades: 5',
      offerBuy: 'Compra',
      ratingOf4: '4 de 5',
      guideHintHeading: 'A prop hi ha una guia…',
      selfName: 'Català',
      webTitle: 'Guies de la ciutat',
      webPrivacyTitle: 'Privadesa',
    },
    tr: {
      whatToDo: 'Keşfet →',
      aboutCity: 'Şehir hakkında',
      recenter: 'Neredeyim',
      guideLink: 'Rehbere git',
      paid: 'Ücretli',
      timeCapForm60: 'En fazla bir saat',
      timeCapBase30: 'En fazla 30 dk',
      stopsCount5: 'Duraklar: 5',
      offerBuy: 'Satın Al',
      ratingOf4: '4 / 5',
      guideHintHeading: 'Yakında bir rehber var…',
      selfName: 'Türkçe',
      webTitle: 'Şehir rehberleri',
      webPrivacyTitle: 'Gizlilik',
    },
  },
  timeCapForms: timeCapWordsFor('is', 'ga', 'mt', 'ca', 'tr'),
  webData: { is: webIs, ga: webGa, mt: webMt, ca: webCa, tr: webTr },
});
