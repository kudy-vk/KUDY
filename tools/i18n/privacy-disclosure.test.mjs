// APR-08.b (issue #853): the privacy paragraphs must keep naming the actual
// data flows the APR-08 inventory proved (D03–D08/D12): RevenueCat as a
// separate recipient with the device-UUID buyer id, the KUDY server device
// registration with the one-way IP hash, the server-held ratings, and the
// deletion boundary that does not erase store or RevenueCat records. Reverting
// any of those disclosures from the be source or dropping the RevenueCat
// naming from a shipped translation fails here — a stale-claims guard, not a
// style check.
//
// APR-08.a (issue #849, criterion 5): web.ui.privacyRetention must keep the
// honest state — the 14-month retention of raw events — and must NOT promise
// stored per-route aggregates: retention-core.ts states «no aggregate table
// exists yet», so the claim is unproven. The absence probes pin the direction
// of failure: re-adding an aggregate promise to any language must fail here
// until a real aggregate store exists (then the guard is consciously updated
// together with the store and the anonymization evidence).
import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMPLETE_UI_LOCALES } from '../../contracts/ui-locales.ts';
import { loadUiMessagesSource } from '../../contracts/ui-messages/ui-messages.mjs';
import { loadUiMessageTranslations } from '../../contracts/ui-messages/translations.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const sourceDoc = loadUiMessagesSource(join(root, 'contracts/ui-messages/source.json'));

function sourceText(id) {
  const record = sourceDoc.records.find((record) => record.id === id);
  assert.ok(record, `source record ${id} exists`);
  return record.source;
}

const PRIVACY_PURCHASES = 'web.ui.privacyPurchases';
const PRIVACY_APP_DATA = 'web.ui.privacyAppData';
const PRIVACY_DELETION = 'web.ui.privacyDeletion';
const PRIVACY_RETENTION = 'web.ui.privacyRetention';

// APR-08.a criterion 5: the stored-aggregate promise was removed in every
// language (no aggregate table exists — retention-core.ts), while the proven
// 14-month raw-event retention stays. The zh fragments are escapes so this
// source file stays ASCII.
const RETENTION_PROBES = {
  be: { aggregate: 'агрэгаваныя лічбы', retention: '14 месяцаў' },
  en: { aggregate: 'aggregated counts', retention: '14 months' },
  uk: { aggregate: 'агреговані числа', retention: '14 місяців' },
  cs: { aggregate: 'agregované čísla', retention: '14 měsíců' },
  de: { aggregate: 'aggregierte Zahlen', retention: '14 Monate' },
  es: { aggregate: 'cifras agregadas', retention: '14 meses' },
  fr: { aggregate: 'chiffres agrégés', retention: '14 mois' },
  sv: { aggregate: 'aggregerade siffror', retention: '14 månader' },
  zh: {
    aggregate: '\u6309\u8DEF\u7EBF\u6C47\u603B\u7684\u6570\u5B57',
    retention: '14\u4E2A\u6708',
  },
  nb: { aggregate: 'aggregerte tall', retention: '14 måneder' },
  pl: { aggregate: 'zagregowane liczby', retention: '14 miesięcy' },
  da: { aggregate: 'aggregerede tal', retention: '14 måneder' },
  nl: { aggregate: 'geaggregeerde aantallen', retention: '14 maanden' },
  pt: { aggregate: 'contagens agregadas', retention: '14 meses' },
  it: { aggregate: 'numeri aggregati', retention: '14 mesi' },
  fi: { aggregate: 'agregoidut luvut', retention: '14 kuukautta' },
  lt: { aggregate: 'agreguoti skaičiai', retention: '14 mėnesių' },
  et: { aggregate: 'agregeeritud numbrid', retention: '14 kuud' },
  lv: { aggregate: 'agregēti skaitļi', retention: '14 mēnešus' },
  sk: { aggregate: 'agregované čísla', retention: '14 mesiacov' },
  hu: { aggregate: 'aggregált számok', retention: '14 hónapig' },
  sl: { aggregate: 'združene številke', retention: '14 mesecev' },
  hr: { aggregate: 'agregirani brojevi', retention: '14 mjeseci' },
  ro: { aggregate: 'numere agregate', retention: '14 luni' },
  bg: { aggregate: 'агрегирани числа', retention: '14 месеца' },
  el: { aggregate: 'συγκεντρωτικοί αριθμοί', retention: '14 μήνες' },
  sr: { aggregate: 'агрегирани бројеви', retention: '14 месеци' },
  bs: { aggregate: 'agregirani brojevi', retention: '14 mjeseci' },
  mk: { aggregate: 'агрегирани бројки', retention: '14 месеци' },
  sq: { aggregate: 'numra të agreguar', retention: '14 muaj' },
  is: { aggregate: 'samanteiknaðar tölur', retention: '14 mánuði' },
  ga: { aggregate: 'uimhreacha comhiomlánta', retention: '14 mí' },
  mt: { aggregate: 'numri miġma', retention: '14 xahar' },
  ca: { aggregate: 'xifres agregades', retention: '14 mesos' },
  tr: { aggregate: 'toplu sayılar', retention: '14 ay' },
  ru: { aggregate: 'агрегированные числа', retention: '14 месяцев' },
  lb: { aggregate: 'aggregéiert Zuelen', retention: '14 Mount' },
  cnr: { aggregate: 'агрегирани бројеви', retention: '14 мјесеци' },
  nn: { aggregate: 'samantelte tal', retention: '14 månader' },
  rm: { aggregate: 'numers agregads', retention: '14 mais' },
  ka: { aggregate: 'აგრეგირებული რიცხვები', retention: '14 თვე' },
  hy: { aggregate: 'ագրեգացված թվեր', retention: '14 ամիս' },
  az: { aggregate: 'aqreqatlı rəqəmlər', retention: '14 ay' },
};

test('be source names RevenueCat, the device registration, the IP hash and the deletion boundary', () => {
  const purchases = sourceText(PRIVACY_PURCHASES);
  assert.ok(purchases.includes('RevenueCat'), 'privacyPurchases must name RevenueCat');
  assert.ok(purchases.includes('App Store') && purchases.includes('Google Play'), 'privacyPurchases keeps the store names');
  assert.ok(purchases.includes('ідэнтыфікатар прылады'), 'privacyPurchases ties RevenueCat to the device identifier');

  const appData = sourceText(PRIVACY_APP_DATA);
  assert.ok(appData.includes('аднабаковы hash IP-адраса'), 'privacyAppData must disclose the one-way IP hash');
  assert.ok(appData.includes('hash сакрэта'), 'privacyAppData must disclose the server-side secret hash');
  assert.ok(
    appData.includes('перадаецца серверу KUDY з кожным яе запытам як ключ доступа'),
    'privacyAppData must state the bearer mechanism (the secret travels with every request)',
  );
  assert.ok(appData.includes('Ацэнкі маршрутаў і месцаў'), 'privacyAppData must disclose the server-held ratings');
  assert.ok(appData.includes('без вольнага тэксту'), 'ratings disclosure keeps the no-free-text boundary');

  const deletion = sourceText(PRIVACY_DELETION);
  assert.ok(deletion.includes('RevenueCat'), 'privacyDeletion must state the RevenueCat boundary');
  assert.ok(deletion.includes('не выдаляе'), 'privacyDeletion must state what the button does not erase');
});

// Per-locale markers that pin each privacyAppData disclosure sentence
// individually (voka #942 round 2): dropping one sentence must fail the
// guard, so every probe matches only its own sentence. zh entries are written
// as escapes so this source file stays ASCII.
const APPDATA_PROBES = {
  en: {
    ipHash: 'one-way hash of the IP address',
    ratings: 'selected reasons',
    accessKey: 'as the access key',
  },
  uk: {
    ipHash: 'односторонній hash IP-адреси',
    ratings: 'вибрані причини',
    accessKey: 'як ключ доступу',
  },
  cs: {
    ipHash: 'jednosměrný hash IP adresy',
    ratings: 'vybrané důvody',
    accessKey: 'jako přístupový klíč',
  },
  de: {
    ipHash: 'Einweg-Hash der IP-Adresse',
    ratings: 'ausgewählte Gründe',
    accessKey: 'als Zugriffsschlüssel',
  },
  es: {
    ipHash: 'hash unidireccional de la dirección IP',
    ratings: 'los motivos elegidos',
    accessKey: 'como clave de acceso',
  },
  fr: {
    ipHash: 'hachage unidirectionnel',
    ratings: 'les raisons choisies',
    accessKey: "comme clé d'accès",
  },
  sv: {
    ipHash: 'envägs-hash av IP-adressen',
    ratings: 'valda skäl',
    accessKey: 'som åtkomstnyckel',
  },
  zh: {
    ipHash: '\u5355\u5411\u54C8\u5E0C',
    ratings: '\u6240\u9009\u539f\u56e0',
    accessKey: '\u4f5c\u4e3a\u8bbf\u95ee\u5bc6\u94a5',
  },
  nb: {
    ipHash: 'enveis-hash av IP-adressen',
    ratings: 'valgte årsaker',
    accessKey: 'som tilgangsnøkkel',
  },
  pl: {
    ipHash: 'jednokierunkowy hash adresu IP',
    ratings: 'wybrane powody',
    accessKey: 'jako klucz dostępu',
  },
  da: {
    ipHash: 'envejs-hash af IP-adressen',
    ratings: 'valgte årsager',
    accessKey: 'som adgangsnøgle',
  },
  nl: {
    ipHash: 'eenrichtings-hash van het IP-adres',
    ratings: 'gekozen redenen',
    accessKey: 'als toegangssleutel',
  },
  pt: {
    ipHash: 'hash unidirecional do endereço IP',
    ratings: 'motivos selecionados',
    accessKey: 'como chave de acesso',
  },
  it: {
    ipHash: "hash unidirezionale dell'indirizzo IP",
    ratings: 'motivi selezionati',
    accessKey: 'come chiave di accesso',
  },
  fi: {
    ipHash: 'yksisuuntaisen IP-osoitteen hajautuksen',
    ratings: 'valitut syyt',
    accessKey: 'pääsyavaimena',
  },
  lt: {
    ipHash: 'vienkryptis IP adreso maišos kodas',
    ratings: 'pasirinktos priežastys',
    accessKey: 'kaip prieigos raktas',
  },
  et: {
    ipHash: 'IP-aadressi ühesuunalist räsi',
    ratings: 'valitud põhjused',
    accessKey: 'pöördumisvõtmena',
  },
  lv: {
    ipHash: 'vienpusējs IP adreses haškods',
    ratings: 'izvēlētie iemesli',
    accessKey: 'kā piekļuves atslēga',
  },
  sk: {
    ipHash: 'jednosmerný hash IP adresy',
    ratings: 'vybrané dôvody',
    accessKey: 'ako prístupový kľúč',
  },
  hu: {
    ipHash: 'IP-cím egyirányú kivonatát',
    ratings: 'kiválasztott okok',
    accessKey: 'hozzáférési kulcsként',
  },
  sl: {
    ipHash: 'enesmerno zgostitev IP-naslova',
    ratings: 'izbrane razloge',
    accessKey: 'kot dostopni ključ',
  },
  hr: {
    ipHash: 'jednosmjerni hash IP adrese',
    ratings: 'odabrani razlozi',
    accessKey: 'kao ključ za pristup',
  },
  ro: {
    ipHash: 'hash unidirecțional al adresei IP',
    ratings: 'motivele selectate',
    accessKey: 'ca cheie de acces',
  },
  bg: {
    ipHash: 'еднопосочен hash на IP адреса',
    ratings: 'избраните причини',
    accessKey: 'като ключ за достъп',
  },
  el: {
    ipHash: 'μονόδρομο hash της διεύθυνσης IP',
    ratings: 'επιλεγμένοι λόγοι',
    accessKey: 'ως κλειδί πρόσβασης',
  },
  sr: {
    ipHash: 'једносмерни hash IP адресе',
    ratings: 'изабрани разлози',
    accessKey: 'као кључ за приступ',
  },
  bs: {
    ipHash: 'jednosmjerni hash IP adrese',
    ratings: 'odabrani razlozi',
    accessKey: 'kao ključ za pristup',
  },
  mk: {
    ipHash: 'еднонасочно хеширање на IP адресата',
    ratings: 'избраните причини',
    accessKey: 'како клуч за пристап',
  },
  sq: {
    ipHash: 'hash njëdrejtimsh të adresës IP',
    ratings: 'arsyet e zgjedhura',
    accessKey: 'si çelës qasjeje',
  },
  is: {
    ipHash: 'einþáttarhash á IP-vistfangi',
    ratings: 'valdar ástæður',
    accessKey: 'sem aðgangslykil',
  },
  ga: {
    ipHash: 'hais aonbhealaigh ar an seoladh IP',
    ratings: 'na cúiseanna roghnaithe',
    accessKey: 'mar eochair rochtana',
  },
  mt: {
    ipHash: "hash unidirezzjonali ta' l-indirizz IP",
    ratings: 'raġuni magħżula',
    accessKey: "ta' aċċess",
  },
  ca: {
    ipHash: "hash unidireccional de l'adreça IP",
    ratings: 'els motius seleccionats',
    accessKey: "com a clau d'accés",
  },
  tr: {
    ipHash: 'tek yönlü karma',
    ratings: 'seçilen nedenler',
    accessKey: 'erişim anahtarı olarak',
  },
  ru: {
    ipHash: 'однонаправленный хеш IP-адреса',
    ratings: 'выбранные причины',
    accessKey: 'как ключ доступа',
  },
  lb: {
    ipHash: 'Hash vun der IP-Adress',
    ratings: 'gewielte Grënn',
    accessKey: 'Zougangsschlëssel',
  },
  cnr: {
    ipHash: 'једносмјерни hash IP адресе',
    ratings: 'изабрани разлози',
    accessKey: 'као кључ за приступ',
  },
  nn: {
    ipHash: 'einsretta hash av IP-adressa',
    ratings: 'valde årsaker',
    accessKey: 'som tilgangsnøkkel',
  },
  rm: {
    ipHash: "hash en ina direcziun da l'adressa IP",
    ratings: 'las raschuns tschernidas',
    accessKey: "clav d'access",
  },
  ka: {
    ipHash: 'ერთმხრივ ჰეშს',
    ratings: 'არჩეული მიზეზები',
    accessKey: 'წვდომის გასაღებად',
  },
  hy: {
    ipHash: 'IP հասցեի միակողմանի հեշ',
    ratings: 'ընտրված պատճառներ',
    accessKey: 'որպես մուտքի բանալի',
  },
  az: {
    ipHash: 'tək istiqamətli heşi',
    ratings: 'seçilmiş səbəblər',
    accessKey: 'giriş açarı kimi',
  },
};

for (const locale of COMPLETE_UI_LOCALES.filter((code) => code !== 'be')) {
  test(`${locale}: shipped privacy paragraphs keep the RevenueCat naming and appData disclosures`, () => {
    const set = loadUiMessageTranslations(
      join(root, `contracts/ui-messages/translations/${locale}.json`),
      sourceDoc,
      COMPLETE_UI_LOCALES,
    );
    for (const id of [PRIVACY_PURCHASES, PRIVACY_DELETION]) {
      const record = set.records.find((record) => record.id === id);
      assert.ok(record, `${locale}: translation record ${id} exists`);
      assert.ok(
        record.value.includes('RevenueCat'),
        `${locale}: ${id} must keep the RevenueCat brand name (brand names stay Latin)`,
      );
    }
    const appData = set.records.find((record) => record.id === PRIVACY_APP_DATA);
    assert.ok(appData, `${locale}: translation record ${PRIVACY_APP_DATA} exists`);
    for (const [disclosure, probe] of Object.entries(APPDATA_PROBES[locale])) {
      assert.ok(
        appData.value.includes(probe),
        `${locale}: ${PRIVACY_APP_DATA} must keep the ${disclosure} disclosure (${probe})`,
      );
    }
  });
}

test('be source states the 14-month retention without promising stored aggregates', () => {
  const retention = sourceText(PRIVACY_RETENTION);
  assert.ok(
    retention.includes(RETENTION_PROBES.be.retention),
    'privacyRetention must keep the 14-month raw-event retention',
  );
  assert.ok(
    !retention.includes(RETENTION_PROBES.be.aggregate),
    'privacyRetention must not promise stored per-route aggregates (no aggregate table exists — APR-08.a #849)',
  );
});

for (const locale of COMPLETE_UI_LOCALES.filter((code) => code !== 'be')) {
  test(`${locale}: shipped privacyRetention keeps the retention term and drops the aggregate promise`, () => {
    const set = loadUiMessageTranslations(
      join(root, `contracts/ui-messages/translations/${locale}.json`),
      sourceDoc,
      COMPLETE_UI_LOCALES,
    );
    const record = set.records.find((record) => record.id === PRIVACY_RETENTION);
    assert.ok(record, `${locale}: translation record ${PRIVACY_RETENTION} exists`);
    assert.ok(
      record.value.includes(RETENTION_PROBES[locale].retention),
      `${locale}: ${PRIVACY_RETENTION} must keep the 14-month retention (${RETENTION_PROBES[locale].retention})`,
    );
    assert.ok(
      !record.value.includes(RETENTION_PROBES[locale].aggregate),
      `${locale}: ${PRIVACY_RETENTION} must not promise stored per-route aggregates (no aggregate table exists — APR-08.a #849)`,
    );
  });
}
