// The Estonian, Latvian, Slovak, Hungarian and Slovenian catalogues' locale-
// specific rendering suite (EU-UI-02, issue #378). The assertions live in the
// shared ui-locale-render-suite.mjs; this file carries the wave's authored
// words (test/ui-locale-render-suite.mjs — one suite, not per-wave copies).
import { registerLocaleRenderSuite } from './ui-locale-render-suite.mjs';
import { et as webEt } from '../web/lib/i18n/et.ts';
import { lv as webLv } from '../web/lib/i18n/lv.ts';
import { sk as webSk } from '../web/lib/i18n/sk.ts';
import { hu as webHu } from '../web/lib/i18n/hu.ts';
import { sl as webSl } from '../web/lib/i18n/sl.ts';

registerLocaleRenderSuite({
  label: 'EU-UI-02',
  expected: {
    et: {
      whatToDo: 'Mida teha →',
      aboutCity: 'Linna teejuht',
      recenter: 'Kus ma olen',
      guideLink: 'Vaata giidi',
      paid: 'Tasuline',
      timeCapForm60: 'Kuni tund',
      timeCapBase30: 'Kuni 30 min',
      stopsCount5: 'Peatused: 5',
      offerBuy: 'Osta',
      ratingOf4: '4 / 5',
      guideHintHeading: 'Lähedal on giid…',
      selfName: 'Eesti',
      webTitle: 'Linna giidid',
      webPrivacyTitle: 'Privaatsus',
    },
    lv: {
      whatToDo: 'Ko darīt →',
      aboutCity: 'Par pilsētu',
      recenter: 'Kur es esmu',
      guideLink: 'Uz gidu',
      paid: 'Maksas',
      timeCapForm60: 'Līdz stundai',
      timeCapBase30: 'Līdz 30 min',
      stopsCount5: 'Pieturas: 5',
      offerBuy: 'Pirkt',
      ratingOf4: '4 no 5',
      guideHintHeading: 'Netālu ir gids…',
      selfName: 'Latviešu',
      webTitle: 'Pilsētas gidi',
      webPrivacyTitle: 'Privātums',
    },
    sk: {
      whatToDo: 'Čo robiť →',
      aboutCity: 'O meste',
      recenter: 'Kde som',
      guideLink: 'K sprievodcovi',
      paid: 'Platené',
      timeCapForm60: 'Do hodiny',
      timeCapBase30: 'Do 30 min',
      stopsCount5: 'Zastavenia: 5',
      offerBuy: 'Kúpiť',
      ratingOf4: '4 z 5',
      guideHintHeading: 'Poblíž je sprievodca…',
      selfName: 'Slovenčina',
      webTitle: 'Mestské sprievodcovia',
      webPrivacyTitle: 'Súkromie',
    },
    hu: {
      whatToDo: 'Programok →',
      aboutCity: 'A városról',
      recenter: 'Hol vagyok',
      guideLink: 'A kalauzhoz',
      paid: 'Fizetős',
      timeCapForm60: 'Legfeljebb egy óra',
      timeCapBase30: 'Legfeljebb 30 perc',
      stopsCount5: 'Megállók: 5',
      offerBuy: 'Vásárlás',
      ratingOf4: '4 / 5',
      guideHintHeading: 'A közelben van kalauz…',
      selfName: 'Magyar',
      webTitle: 'Városi kalauzok',
      webPrivacyTitle: 'Adatvédelem',
    },
    sl: {
      whatToDo: 'Kaj početi →',
      aboutCity: 'O mestu',
      recenter: 'Kje sem',
      guideLink: 'K vodniku',
      paid: 'Plačljivo',
      timeCapForm60: 'Do ene ure',
      timeCapBase30: 'Do 30 min',
      stopsCount5: 'Točke: 5',
      offerBuy: 'Kupi',
      ratingOf4: '4 od 5',
      guideHintHeading: 'V bližini je vodnik…',
      selfName: 'Slovenščina',
      webTitle: 'Mestni vodniki',
      webPrivacyTitle: 'Zasebnost',
    },
  },
  timeCapForms: {
    et: { 60: 'Kuni tund', 120: 'Kuni kaks tundi', 240: 'Pool päeva' },
    lv: { 60: 'Līdz stundai', 120: 'Līdz divām stundām', 240: 'Uz pusi dienas' },
    sk: { 60: 'Do hodiny', 120: 'Do dvoch hodín', 240: 'Na pol dňa' },
    hu: { 60: 'Legfeljebb egy óra', 120: 'Legfeljebb két óra', 240: 'Fél nap' },
    sl: { 60: 'Do ene ure', 120: 'Do dveh ur', 240: 'Na pol dneva' },
  },
  webData: { et: webEt, lv: webLv, sk: webSk, hu: webHu, sl: webSl },
});
