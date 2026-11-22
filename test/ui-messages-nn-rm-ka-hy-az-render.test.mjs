// The Nynorsk, Romansh, Georgian, Armenian and Azerbaijani catalogues' locale-
// specific rendering suite (EU-UI-06, issue #395 — the remaining official
// state languages from the #384 audit). The assertions live in the shared
// ui-locale-render-suite.mjs; this file carries the wave's authored words
// (test/ui-locale-render-suite.mjs — one suite, not per-wave copies).
import { registerLocaleRenderSuite } from './ui-locale-render-suite.mjs';
import { timeCapWordsFor } from './ui-locale-time-cap-words.mjs';
import { nn as webNn } from '../web/lib/i18n/nn.ts';
import { rm as webRm } from '../web/lib/i18n/rm.ts';
import { ka as webKa } from '../web/lib/i18n/ka.ts';
import { hy as webHy } from '../web/lib/i18n/hy.ts';
import { az as webAz } from '../web/lib/i18n/az.ts';

registerLocaleRenderSuite({
  label: 'EU-UI-06',
  expected: {
    nn: {
      whatToDo: 'Aktivitetar →',
      aboutCity: 'Om byen',
      recenter: 'Kor er eg',
      guideLink: 'Til guiden',
      paid: 'Betalt',
      timeCapForm60: 'Opp til éi time',
      timeCapBase30: 'Opp til 30 min',
      stopsCount5: 'Stopp: 5',
      offerBuy: 'Kjøp',
      ratingOf4: '4 av 5',
      guideHintHeading: 'I nærleiken er det ein guide…',
      selfName: 'Nynorsk',
      webTitle: 'Byguidar',
      webPrivacyTitle: 'Personvern',
    },
    rm: {
      whatToDo: 'Activitads →',
      aboutCity: 'Davart la citad',
      recenter: 'Nua sun jau',
      guideLink: 'A la guida',
      paid: 'Pagà',
      timeCapForm60: 'Fin ad ina ura',
      timeCapBase30: 'Fin a 30 min',
      stopsCount5: 'Puncts: 5',
      offerBuy: 'Cumprar',
      ratingOf4: '4 da 5',
      guideHintHeading: 'En la vicinanza è ina guida…',
      selfName: 'Rumantsch',
      webTitle: 'Guidas dalla citad',
      webPrivacyTitle: 'Protecziun da datas',
    },
    ka: {
      whatToDo: 'რა ვაკეთოთ →',
      aboutCity: 'ქალაქის შესახებ',
      recenter: 'სადა ვარ',
      guideLink: 'გიდისკენ',
      paid: 'ფასიანი',
      timeCapForm60: 'ერთ საათამდე',
      timeCapBase30: 'მდე 30 წთ',
      stopsCount5: 'გაჩერებები: 5',
      offerBuy: 'შეძენა',
      ratingOf4: '4 / 5',
      guideHintHeading: 'ახლოს არის გიდი…',
      selfName: 'ქართული',
      webTitle: 'ქალაქის გიდები',
      webPrivacyTitle: 'კონფიდენციალურობა',
    },
    hy: {
      whatToDo: 'Ինչ անել →',
      aboutCity: 'Քաղաքի մասին',
      recenter: 'Որտեղ եմ',
      guideLink: 'Դեպի ուղեցույց',
      paid: 'Վճարովի',
      timeCapForm60: 'Մինչև մեկ ժամ',
      timeCapBase30: 'Մինչև 30 րոպե',
      stopsCount5: 'Կանգառներ՝ 5',
      offerBuy: 'Գնել',
      ratingOf4: '4 / 5',
      guideHintHeading: 'Մոտակայքում ուղեցույց կա…',
      selfName: 'Հայերեն',
      webTitle: 'Քաղաքի ուղեցույցներ',
      webPrivacyTitle: 'Գաղտնիություն',
    },
    az: {
      whatToDo: 'Nə etməli →',
      aboutCity: 'Şəhər haqqında',
      recenter: 'Hardayam',
      guideLink: 'Bələdçiyə',
      paid: 'Pullu',
      timeCapForm60: 'Ən çox bir saat',
      timeCapBase30: 'Ən çox 30 dəq',
      stopsCount5: 'Dayanacaqlar: 5',
      offerBuy: 'Al',
      ratingOf4: '4 / 5',
      guideHintHeading: 'Yaxınlıqda bələdçi var…',
      selfName: 'Azərbaycan dili',
      webTitle: 'Şəhər bələdçiləri',
      webPrivacyTitle: 'Məxfilik',
    },
  },
  timeCapForms: timeCapWordsFor('nn', 'rm', 'ka', 'hy', 'az'),
  webData: { nn: webNn, rm: webRm, ka: webKa, hy: webHy, az: webAz },
});
