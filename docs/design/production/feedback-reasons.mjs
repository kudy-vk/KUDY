// UI-only concept vocabulary for #207. New codes are proposals, NOT accepted
// by the feedback API: the actual app still accepts its existing closed list.
// Do not integrate these chips into app/ until the reason-code contract is
// explicitly expanded, translated and verified server-side.
export const EXISTING_REASON_CODES = [
  'interesting_stories', 'clear_delivery', 'worth_visiting',
  'too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch',
  'hard_to_reach', 'access_problem',
];
export const PROPOSED_REASON_CODES = [
  'easy_route', 'warm_storytelling', 'good_mood', 'wanted_more', 'new_discovery',
  'would_recommend', 'fresh_city_view', 'place_atmosphere', 'discovered_details',
  'easy_to_find', 'wanted_stay', 'memorable_spot',
];

// Every option is a unique idea, not a synonym of a different stored code.
// A given rating sees only a compatible tone; no options are preselected.
// The form still limits selection to three independent reasons.
export const REASON_SUGGESTIONS = {
  guide: {
    1: ['too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch'],
    2: ['too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch'],
    3: ['too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch'],
    4: ['interesting_stories', 'clear_delivery', 'easy_route', 'warm_storytelling', 'good_mood', 'wanted_more'],
    5: ['interesting_stories', 'clear_delivery', 'easy_route', 'warm_storytelling', 'good_mood',
      'wanted_more', 'new_discovery', 'would_recommend', 'fresh_city_view'],
  },
  place: {
    1: ['description_mismatch', 'hard_to_reach', 'access_problem'],
    2: ['description_mismatch', 'hard_to_reach', 'access_problem'],
    3: ['description_mismatch', 'hard_to_reach', 'access_problem'],
    4: ['worth_visiting', 'place_atmosphere', 'discovered_details', 'easy_to_find', 'would_recommend', 'wanted_stay'],
    5: ['worth_visiting', 'place_atmosphere', 'discovered_details', 'easy_to_find',
      'would_recommend', 'wanted_stay', 'fresh_city_view', 'memorable_spot'],
  },
};

export function suggestedReasons(kind, score) {
  if (!Number.isInteger(score) || score < 1 || score > 5) return [];
  return REASON_SUGGESTIONS[kind]?.[score] ?? [];
}

// Keep a selection only when the matching new star rating still offers it.
export function keepCompatibleReasons(kind, nextScore, selected) {
  const allowed = new Set(suggestedReasons(kind, nextScore));
  return [...selected].filter((code) => allowed.has(code));
}

// Suggested labels for 4–5 stars. English is the source; translations are
// provisional design-copy drafts and need native review before app integration.
// For 1–3 stars the mockup uses the canonical translated reasonText.* records.
export const POSITIVE_LABELS = {
  en: {
    interesting_stories: 'The stories came alive',
    clear_delivery: 'Easy to follow along',
    worth_visiting: 'Glad I stopped by',
    easy_route: 'Easy to find my way',
    warm_storytelling: 'Like a friend telling stories',
    good_mood: 'Just the right mood',
    wanted_more: 'I wanted one more story',
    new_discovery: 'Learned something new',
    would_recommend: "I'll tell my friends",
    fresh_city_view: 'Saw the city differently',
    place_atmosphere: 'This place has a soul',
    discovered_details: 'Spotted lovely details',
    easy_to_find: 'Easy to get here',
    wanted_stay: 'Wanted to linger',
    memorable_spot: 'A place I will remember',
  },
  be: {
    interesting_stories: 'Гісторыі ажывалі',
    clear_delivery: 'Лёгка было слухаць',
    worth_visiting: 'Не дарма сюды завітаў',
    easy_route: 'Не губляўся па дарозе',
    warm_storytelling: 'Нібы сябар расказваў',
    good_mood: 'Злавіў патрэбны настрой',
    wanted_more: 'Хацелася яшчэ гісторыю',
    new_discovery: 'Адкрыў нешта новае',
    would_recommend: 'Параю сваім',
    fresh_city_view: 'Убачыў горад па-новаму',
    place_atmosphere: 'У месца ёсць душа',
    discovered_details: 'Заўважыў цікавыя дробязі',
    easy_to_find: 'Лёгка было дабрацца',
    wanted_stay: 'Хацелася затрымацца',
    memorable_spot: 'Гэтае месца запомню',
  },
  uk: {
    interesting_stories: 'Історії оживали', clear_delivery: 'Було легко слухати',
    worth_visiting: 'Недарма сюди завітав', easy_route: 'Легко було орієнтуватися',
    warm_storytelling: 'Наче друг розповідав', good_mood: 'Саме той настрій',
    wanted_more: 'Хотілося ще одну історію', new_discovery: 'Дізнався щось нове',
    would_recommend: 'Пораджу своїм', fresh_city_view: 'Побачив місто інакше',
    place_atmosphere: 'У місця є душа', discovered_details: 'Помітив цікаві дрібниці',
    easy_to_find: 'Легко було дістатися', wanted_stay: 'Хотілося затриматися',
    memorable_spot: "Запам'ятаю це місце",
  },
  de: {
    interesting_stories: 'Die Geschichten wurden lebendig', clear_delivery: 'Leicht zu folgen',
    worth_visiting: 'Der Besuch hat sich gelohnt', easy_route: 'Leicht den Weg gefunden',
    warm_storytelling: 'Wie einem Freund zuzuhören', good_mood: 'Genau die richtige Stimmung',
    wanted_more: 'Ich wollte noch eine Geschichte', new_discovery: 'Etwas Neues entdeckt',
    would_recommend: 'Erzähle ich meinen Freunden', fresh_city_view: 'Die Stadt neu gesehen',
    place_atmosphere: 'Dieser Ort hat Seele', discovered_details: 'Schöne Details entdeckt',
    easy_to_find: 'Leicht zu erreichen', wanted_stay: 'Ich wollte länger bleiben',
    memorable_spot: 'Diesen Ort vergesse ich nicht',
  },
  es: {
    interesting_stories: 'Las historias cobraron vida', clear_delivery: 'Fácil de seguir',
    worth_visiting: 'Valió la pena pasar por aquí', easy_route: 'Me orienté sin problemas',
    warm_storytelling: 'Como escuchar a un amigo', good_mood: 'El ambiente perfecto',
    wanted_more: 'Quería otra historia', new_discovery: 'Descubrí algo nuevo',
    would_recommend: 'Se lo contaré a mis amigos', fresh_city_view: 'Vi la ciudad de otra forma',
    place_atmosphere: 'Este lugar tiene alma', discovered_details: 'Descubrí pequeños detalles',
    easy_to_find: 'Fácil de llegar', wanted_stay: 'Quería quedarme más',
    memorable_spot: 'Recordaré este lugar',
  },
  fr: {
    interesting_stories: 'Les histoires prenaient vie', clear_delivery: 'Facile à suivre',
    worth_visiting: 'Ça valait le détour', easy_route: 'Facile de se repérer',
    warm_storytelling: "Comme si un ami racontait", good_mood: "Juste la bonne ambiance",
    wanted_more: "J'en voulais encore", new_discovery: "J'ai appris quelque chose",
    would_recommend: "Je le dirai à mes amis", fresh_city_view: "J'ai vu la ville autrement",
    place_atmosphere: "Ce lieu a une âme", discovered_details: "De jolis détails repérés",
    easy_to_find: "Facile d'accès", wanted_stay: "J'avais envie de rester",
    memorable_spot: "Je me souviendrai de ce lieu",
  },
  cs: {
    interesting_stories: 'Příběhy ožily', clear_delivery: 'Dobře se to poslouchalo',
    worth_visiting: 'Stálo za to se zastavit', easy_route: 'Snadná orientace',
    warm_storytelling: 'Jako by vyprávěl kamarád', good_mood: 'Přesně ta správná nálada',
    wanted_more: 'Chtěl jsem další příběh', new_discovery: 'Dozvěděl jsem se něco nového',
    would_recommend: 'Doporučím přátelům', fresh_city_view: 'Viděl jsem město jinak',
    place_atmosphere: 'Tohle místo má duši', discovered_details: 'Všiml jsem si zajímavých detailů',
    easy_to_find: 'Snadno se sem dostává', wanted_stay: 'Chtěl jsem tu zůstat déle',
    memorable_spot: 'Na tohle místo nezapomenu',
  },
  sv: {
    interesting_stories: 'Berättelserna fick liv', clear_delivery: 'Lätt att hänga med',
    worth_visiting: 'Värt att stanna till', easy_route: 'Lätt att hitta rätt',
    warm_storytelling: 'Som att lyssna på en vän', good_mood: 'Precis rätt känsla',
    wanted_more: 'Ville höra en berättelse till', new_discovery: 'Lärde mig något nytt',
    would_recommend: 'Ska tipsa mina vänner', fresh_city_view: 'Såg staden på nytt',
    place_atmosphere: 'Platsen har själ', discovered_details: 'Upptäckte fina detaljer',
    easy_to_find: 'Lätt att ta sig hit', wanted_stay: 'Ville stanna längre',
    memorable_spot: 'En plats att minnas',
  },
};

export function positiveLabel(code, locale) {
  return (POSITIVE_LABELS[locale] ?? POSITIVE_LABELS.en)[code] ?? POSITIVE_LABELS.en[code] ?? '';
}
