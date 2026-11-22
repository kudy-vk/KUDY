// The authored time-cap discrete-form words per UI locale (the {60,120,240}
// forms of native.chrome.timeCap) — the one data table shared by the
// number-render golden suite and the per-wave locale render suites
// (jscpd: one table, not per-suite copies).
export const TIME_CAP_WORDS = {
  be: { 60: 'Да гадзіны', 120: 'Да дзвюх гадзін', 240: 'На паўдня' },
  en: { 60: 'Up to an hour', 120: 'Up to two hours', 240: 'Half a day' },
  uk: { 60: 'До години', 120: 'До двох годин', 240: 'На пів дня' },
  de: { 60: 'Bis zu einer Stunde', 120: 'Bis zu zwei Stunden', 240: 'Ein halber Tag' },
  es: { 60: 'Hasta una hora', 120: 'Hasta dos horas', 240: 'Medio día' },
  fr: { 60: "Jusqu'à une heure", 120: "Jusqu'à deux heures", 240: 'Une demi-journée' },
  cs: { 60: 'Do hodiny', 120: 'Do dvou hodin', 240: 'Půl dne' },
  sv: { 60: 'Upp till en timme', 120: 'Upp till två timmar', 240: 'Halva dagen' },
  zh: { 60: '\u6700\u591A\u4E00\u5C0F\u65F6', 120: '\u6700\u591A\u4E24\u5C0F\u65F6', 240: '\u534A\u5929' },
  nb: { 60: 'Inntil én time', 120: 'Inntil to timer', 240: 'Halv dag' },
  pl: { 60: 'Do 1 godz.', 120: 'Do 2 godz.', 240: 'Do 4 godz.' },
  da: { 60: 'Op til 1 time', 120: 'Op til 2 timer', 240: 'Op til 4 timer' },
  nl: { 60: 'Tot 1 uur', 120: 'Tot 2 uur', 240: 'Tot 4 uur' },
  pt: { 60: 'Até 1 h', 120: 'Até 2 h', 240: 'Até 4 h' },
  it: { 60: "Fino a un'ora", 120: 'Fino a due ore', 240: 'Mezza giornata' },
  fi: { 60: 'Enintään tunti', 120: 'Enintään kaksi tuntia', 240: 'Puoli päivää' },
  lt: { 60: 'Iki valandos', 120: 'Iki dviejų valandų', 240: 'Pusė dienos' },
  et: { 60: 'Kuni tund', 120: 'Kuni kaks tundi', 240: 'Pool päeva' },
  lv: { 60: 'Līdz stundai', 120: 'Līdz divām stundām', 240: 'Uz pusi dienas' },
  sk: { 60: 'Do hodiny', 120: 'Do dvoch hodín', 240: 'Na pol dňa' },
  hu: { 60: 'Legfeljebb egy óra', 120: 'Legfeljebb két óra', 240: 'Fél nap' },
  sl: { 60: 'Do ene ure', 120: 'Do dveh ur', 240: 'Na pol dneva' },
  hr: { 60: 'Do jednog sata', 120: 'Do dva sata', 240: 'Pola dana' },
  ro: { 60: 'Până la o oră', 120: 'Până la două ore', 240: 'O jumătate de zi' },
  bg: { 60: 'До един час', 120: 'До два часа', 240: 'Половин ден' },
  el: { 60: 'Έως μία ώρα', 120: 'Έως δύο ώρες', 240: 'Μισή μέρα' },
  sr: { 60: 'До једног сата', 120: 'До два сата', 240: 'Пола дана' },
  bs: { 60: 'Do jednog sata', 120: 'Do dva sata', 240: 'Pola dana' },
  mk: { 60: 'До еден час', 120: 'До два часа', 240: 'Половина ден' },
  sq: { 60: 'Deri në një orë', 120: 'Deri në dy orë', 240: 'Gjysmë dite' },
  is: { 60: 'Allt að eina klukkustund', 120: 'Allt að tvær klukkustundir', 240: 'Hálfur dagur' },
  ga: { 60: 'Suas le uair an chloig', 120: 'Suas le dhá uair an chloig', 240: 'Leath lae' },
  mt: { 60: 'Sakemm siegħa', 120: 'Sakemm sagħtejn', 240: 'Nofs jum' },
  ca: { 60: 'Fins a una hora', 120: 'Fins a dues hores', 240: 'Mig dia' },
  tr: { 60: 'En fazla bir saat', 120: 'En fazla iki saat', 240: 'Yarım gün' },
  ru: { 60: 'До часа', 120: 'До двух часов', 240: 'На полдня' },
  lb: { 60: 'Bis zu enger Stonn', 120: 'Bis zu zwou Stonnen', 240: 'Hallefdag' },
  cnr: { 60: 'До једног сата', 120: 'До два сата', 240: 'Пола дана' },
  nn: { 60: 'Opp til éi time', 120: 'Opp til to timar', 240: 'Halv dag' },
  rm: { 60: 'Fin ad ina ura', 120: 'Fin a duas uras', 240: 'Mez di' },
  ka: { 60: 'ერთ საათამდე', 120: 'ორ საათამდე', 240: 'ნახევარი დღე' },
  hy: { 60: 'Մինչև մեկ ժամ', 120: 'Մինչև երկու ժամ', 240: 'Կես օր' },
  az: { 60: 'Ən çox bir saat', 120: 'Ən çox iki saat', 240: 'Yarım gün' },
};

// The wave's slice of the table: timeCapForms = timeCapWordsFor('hr', 'ro', ...).
export function timeCapWordsFor(...codes) {
  return Object.fromEntries(codes.map((code) => [code, TIME_CAP_WORDS[code]]));
}
