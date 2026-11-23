// G21.09 (issue #542, criterion 2) — the reusable native message interfaces,
// moved to the shared pure contract zone. The key/parameter contract is the
// TS projection of the G21.24 canonical records
// (contracts/ui-messages/source.json): every key here is anchored to exactly
// one record by the inventory guard (test/ui-messages-inventory.test.mjs) and
// the runtime shape/arity of every record-anchored value is guarded against
// these catalogs by test/ui-message-types.test.mjs — the interfaces and the
// canonical records cannot silently drift apart. This file declares shapes
// only (no runtime code, relative imports only — the contracts zone rule);
// authoring stays in the canonical source/translation data, never here.
//
// Deliberately NOT moved here: RunMapStrings (bound to the engine's StopStatus
// in core/engine/state.ts — the pure contract zone must not import core) and
// PreviewStrings (bound to the controller-owned PreviewReason/PreviewDetail
// vocabulary). Their records are still guarded through the same runtime walk.

import type { CompleteUiLocaleCode } from "./ui-locales.ts";

// G06.05 (16_delivery_backlog.md — G06.05) — the shared UI words of the G06 surfaces, BE/EN per
// the row's first criterion. G14.04.d (16_delivery_backlog.md — G14.04.d) adds the third catalog:
// uk rides the same mechanism beside be/en (uk-release-scope §3.1 — "тая ж
// сістэма, новы набор"), with the catalog keys kept equivalent by the
// parity guard. The catalogs here are presentation-only chrome
// (back labels, loading, the catalog state words, the KUDY surface sections,
// the preview facts line); domain words with diagnostics stay with their
// controllers (runMapStrings, placeDetailStrings, previewStrings). The
// locale argument is the composition root's display locale — the first
// preference of createServices, switchable through its ui-locale store
// (the L02 selection this row deferred to G14.04.d); an unknown locale
// falls back to Belarusian, the app's first preference (the runMapStrings
// idiom).
export type AccessKind = "free" | "paid" | "mixed";

export interface UiStrings {
  readonly back: string;
  readonly backToCity: string;
  // The unknown deep link's words (issue #427): the honest message and the
  // hint that names where the catalog is — the screen never renders dev text.
  readonly notFoundTitle: string;
  readonly notFoundHint: string;
  readonly loading: string;
  readonly walk: string;
  readonly nearby: string;
  readonly guidesLink: string;
  readonly comingSoon: string;
  // The map menu's «Пра горад» entry (issue #200): the reserve-1 fragment
  // opens the static Gdańsk practical guide — it takes the slot that
  // previously rendered the comingSoon word.
  readonly aboutCity: string;
  // The KUDY surface's Explore entry (issue #426): the owner's 2026-10-01
  // decision — the history surface is named «KUDY», not «My KUDY».
  readonly kudyLink: string;
  // The main screen header words (issue #216, decisions M2/M11): the city
  // name on the right and the heading above the map pieces.
  readonly cityName: string;
  readonly whereToToday: string;
  readonly demoVersion: string;
  readonly demoNoticeDetail: string;
  readonly demoNearbyMapAccessibility: string;
  readonly demoNearbyMapLabel: string;
  readonly demoRunMapLabel: string;
  readonly retry: string;
  readonly catalogUnavailable: string;
  readonly catalogTemporarilyUnavailable: string;
  readonly notPublished: string;
  // G21.17 (issue #551): the selected UI language's text-absence
  // explanation (a valid empty catalogue is never a service failure) and
  // the deep link's no-substitution unavailable state.
  readonly textLocaleEmpty: string;
  readonly previewTextUnavailable: string;
  readonly validCache: string;
  readonly previewUnavailable: string;
  readonly degradedData: string;
  readonly myKudy: string;
  readonly historyUnavailable: string;
  readonly currentWalk: string;
  readonly noCurrentWalk: string;
  readonly pastWalks: string;
  readonly noPastWalks: string;
  readonly stateLabel: Record<"active" | "paused" | "finished", string>;
  readonly heardCount: (count: number) => string;
  // The My KUDY row lines (G06.05, AC1): the state word, the local days and
  // the heard count stay one sentence per locale — no hard-coded preposition.
  readonly liveRowLine: (state: string, day: string, heard: number) => string;
  readonly pastRowLine: (startedDay: string, finishedDay: string | null, heard: number) => string;
  readonly access: Record<AccessKind, string>;
  readonly languagesLine: (textLocales: readonly string[]) => string;
  readonly textAudioLine: (textLocales: readonly string[], audioLocales: readonly string[]) => string;
  readonly stopsCount: (count: number) => string;
  readonly sizeMb: (mb: number) => string;
  readonly freeStopsCount: (count: number) => string;
  readonly stopNumber: (position: number) => string;
  // The metadata-row icon words (G06.10.c — docs/agent-tasks/app/G06.10.md): the standalone
  // screen-reader label the icon contract requires — the fact line next to
  // the icon carries the value.
  readonly durationLabel: string;
  readonly stopsLabel: string;
  // The locked stop's badge word — the 🔒 never reads alone (AC1: the
  // screen-reader label is a word, the glyph is decoration).
  readonly locked: string;
  readonly durationRange: (minMinutes: number, maxMinutes: number) => string;
  readonly durationMinutes: (minutes: number) => string;
  readonly switchConfirm: (liveTitle: string, candidateTitle: string) => string;
  readonly switchAccept: string;
  readonly cancel: string;
  // G15.03 (issue #70) — the discovery surfaces' chrome words (BE/EN): the
  // Explore entry, the honest states and the labeled facts of the offer
  // cards. The maps' fallback in the screens is the raw contract value — an
  // unknown reason, difference or season renders verbatim, never dropped.
  readonly whatToDo: string;
  readonly discoveryTitle: string;
  readonly discoveryUnavailable: string;
  readonly discoveryTemporarilyUnavailable: string;
  readonly discoveryEmpty: string;
  readonly discoveryAlternatives: string;
  readonly collectionUnavailable: string;
  readonly collectionUnresolved: string;
  readonly timeUnlimited: string;
  readonly timeCap: (minutes: number) => string;
  readonly seasonName: Record<string, string>;
  readonly reasonText: Record<string, string>;
  readonly differenceText: Record<string, string>;
  // G14.04.d (16_delivery_backlog.md — G14.04.d) — the My KUDY language row (uk-release-scope §4:
  // «Мова прапануецца ў My KUDY»): the row's label and the options' self
  // names, which are the same native words in every catalog — a language is
  // never named through a translation.
  readonly languageLabel: string;
  // The keys are the complete UI locales (contracts/ui-locales.ts): the codes
  // with full catalogues — the picker advertises no others.
  readonly languageSelfNames: Record<CompleteUiLocaleCode, string>;
}

// G06.05 (16_delivery_backlog.md — G06.05, AC4/AC5) — the place detail words. The named moment
// refusals and the play failure's words — a refusal states the reason and the
// way out, a raw diagnostic code never shows alone. An unknown reason renders
// as-is (the placeRefusalText idiom).
export interface PlaceDetailStrings {
  readonly loading: string;
  readonly unavailable: string;
  readonly error: string;
  readonly noFacts: string;
  readonly empty: string;
  teaserLabel: string;
  playLabel: string;
  stopLabel: string;
  resumeLabel: string;
  nowPlaying: string;
  paused: string;
  guideLink: string;
  guideLinkHint: string;
  playHint: string;
  noAudio: string;
  durationUnit: string;
  textLabel: string;
  audioLabel: string;
  // G06.05 (16_delivery_backlog.md — G06.05, AC4/AC5): the named moment refusals and the play
  // failure's words — a refusal states the reason and the way out, a raw
  // diagnostic code never shows alone. An unknown reason renders as-is.
  readonly refusalText: Record<
    'moment#audio-unpublished' | 'moment#session-unroutable' | 'moment#session-refused',
    string
  >;
  readonly playFailed: string;
  readonly playFailedHint: string;
}

// The nearby surface's words (the runMapStrings idiom): the honest location
// notes, the offer list states and the labeled card facts.
export interface NearbyStrings {
  readonly title: string;
  readonly proximityHeader: string;
  readonly reviewHeader: string;
  readonly noteDenied: string;
  readonly noteHeldByWalk: string;
  readonly noteAcquiring: string;
  readonly noteUnstable: string;
  readonly empty: string;
  readonly unavailable: string;
  readonly loading: string;
  readonly indexDegraded: string;
  readonly mapNote: string;
  readonly cardHint: string;
  // UX 09 (issue #434) — the offer-kind word the card marker carries for the
  // screen reader (visual-language.md §9: every icon rendering is named).
  readonly guideLabel: string;
  readonly placeLabel: string;
  readonly textLabel: string;
  readonly audioLabel: string;
  readonly durationUnit: string;
}

// The commerce offer card's words (11 §8): the offer, its dismissal, the
// honest post-store state and the failure way out.
export interface OfferStrings {
  readonly offerTitle: string;
  readonly offerBody: string;
  readonly buy: string;
  readonly dismiss: string;
  // `11` §8 verbatim: «Куплена · трэба загрузіць» — the honest state after
  // the store leg, before the verified access.
  readonly purchasedPending: string;
  readonly errorTitle: string;
  readonly errorBody: string;
  readonly tryAgain: string;
  readonly continueFree: string;
}

// UX 09 (issue #434) — the nearby-guide hint card (GuideHintCard.tsx). The
// card's four words: since G21.25 (2026-10-03-single-source-translations.md — G21.25) they are generated from the
// canonical records plus the reviewed translations. Uk renders through the
// English fallback (decision L1, issue #261) because the uk
// words of this domain are not authored yet.
export interface GuideHintStrings {
  readonly heading: string;
  readonly paid: string;
  readonly openHint: string;
  readonly dismiss: string;
}

// Issue #200/#252 — the words of the «Пра горад» guide (opened from the map
// menu's reserve-1 fragment). The verified fact lines embed their own
// check-date claims — the sources table beside the guide
// (docs/content/about-city-sources.md) records the official source and check
// date per changeable fact.
// Issue #252 — the «Пра горад» wheel screen's words, the generated
// catalogue's shape (components/about-city-strings.generated.ts, be + en
// per decision L1): the ids of the owner-approved mockup word sets
// (docs/design/production/about-words-*.mjs) with the id-only renames the
// nesting rule forced (a key may not be a prefix of another key). The link
// row labels — one label per official page the guide sends the reader to;
// the URLs themselves live beside the screen (about-city-content).
export interface AboutCityStrings {
  readonly wheel: {
    readonly label: string;
  };
  readonly tab: {
    readonly airport: string;
    readonly transport: string;
    readonly city: string;
    readonly food: string;
  };
  readonly head: {
    readonly airport: string;
    readonly transport: string;
    readonly city: string;
    readonly food: string;
  };
  readonly sources: {
    readonly title: string;
  };
  // The device could not open the page: its address stays on the screen.
  readonly link: {
    readonly failed: (url: string) => string;
  };
  readonly u: {
    readonly aboutMin: (n: number) => string;
    readonly everyWeekdays: (n: number) => string;
    readonly hourly: string;
    readonly aboutHourly: string;
  };
  readonly sr: {
    readonly bus: string;
    readonly night: string;
    readonly train: string;
  };
  readonly air: {
    readonly dirLabel: string;
    readonly dirFrom: string;
    readonly dirTo: string;
    readonly from: {
      readonly s1: {
        readonly title: string;
        readonly text: string;
        readonly stop01: string;
        readonly stop02: string;
      };
    };
    readonly to: {
      readonly s1: {
        readonly title: string;
        readonly text: string;
      };
    };
    readonly s2: {
      readonly title: string;
    };
    readonly s3: {
      readonly title: string;
    };
    readonly ticket: {
      readonly bus: {
        readonly title: string;
        readonly where: string;
      };
      readonly train: {
        readonly title: string;
        readonly where: string;
      };
    };
    // The map's airport card: how the airport ties to the city and the way
    // back to the airport section (#303, the mockup's air.map / air.map.go).
    readonly map: string;
    readonly mapGo: string;
  };
  readonly ride: {
    readonly "110": {
      readonly from: string;
      readonly to: string;
      readonly also: string;
    };
    readonly "210": {
      readonly from: string;
      readonly to: string;
    };
    readonly n3: {
      readonly from: string;
      readonly to: string;
      readonly when: string;
      readonly toCentre: string;
      readonly toWrzeszcz: string;
      readonly route: string;
    };
    readonly train: {
      readonly from: string;
      readonly to: string;
      readonly change: string;
      readonly line: string;
      readonly operator: string;
    };
  };
  readonly row: {
    readonly stop: string;
    readonly firstLast: string;
    readonly sunday: string;
    readonly centreStops: string;
    readonly also: string;
    readonly route: string;
    readonly toCentre: string;
    readonly toWrzeszcz: string;
    readonly operator: string;
  };
  readonly tr: {
    readonly modes: string;
    readonly residents: string;
    readonly ztm: {
      readonly title: string;
      readonly meta: string;
      readonly text: string;
    };
    readonly skm: {
      readonly title: string;
      readonly meta: string;
      readonly text: string;
      readonly warn: string;
    };
    readonly rail: {
      readonly title: string;
      readonly meta: string;
      readonly text: string;
    };
    readonly buyLabel: string;
    readonly buy: {
      readonly jakdojade: {
        readonly title: string;
        readonly text: string;
      };
      readonly fala: {
        readonly title: string;
        readonly text: string;
      };
      readonly kompas: {
        readonly title: string;
        readonly text: string;
      };
    };
  };
  readonly city: {
    readonly caption: string;
    readonly get: string;
    readonly summer: string;
  };
  // The illustrated Tricity map of the city section (#303, decisions
  // M12–M13): the map's words, the layer switches, the zone descriptions
  // (the mockup's about-words sets), the station words and the airport
  // card. The nesting-rule renames of the mockup's flat ids: map.list.meta
  // → map.listMeta, stop.plan.from → stop.planFrom, air.map.go → air.mapGo.
  readonly map: {
    readonly label: string;
    readonly role: string;
    readonly zoomIn: string;
    readonly zoomOut: string;
    readonly fit: string;
    readonly google: string;
    readonly layers: string;
    readonly hint: string;
    readonly list: string;
    readonly listMeta: (visit: number, stay: number) => string;
  };
  readonly layer: {
    readonly visit: string;
    readonly stay: string;
    readonly rail: string;
    readonly plan: string;
  };
  readonly zone: {
    readonly stop: (name: string, km: string) => string;
    readonly stare: string;
    readonly przedmiescie: string;
    readonly dolne: string;
    readonly westerplatte: string;
    readonly politechnika: string;
    readonly centrum: string;
    readonly "nowe-ogrody": string;
    readonly "dlugie-ogrody": string;
    readonly kartuska: string;
    readonly siedlce: string;
    readonly powstancow: string;
    readonly chelm: string;
    readonly "orunia-gorna": string;
    readonly wrzeszcz: string;
    readonly przymorze: string;
    readonly "sopot-west": string;
    readonly wzgorze: string;
  };
  readonly stop: {
    readonly tag: string;
    readonly planned: string;
    readonly skm: string;
    readonly pkm: string;
    readonly change: string;
    readonly plan: string;
    readonly planFrom: string;
  };
  readonly place: {
    readonly glowne: string;
    readonly oliwa: string;
    readonly brzezno: string;
    readonly sopot: string;
    readonly gdynia: string;
  };
  readonly get: {
    readonly glowne: string;
    readonly wrzeszcz: string;
    readonly oliwa: {
      readonly tram: string;
      readonly skm: string;
    };
    readonly brzezno: string;
    readonly westerplatte: string;
  };
  readonly food: {
    readonly deliveryLabel: string;
    readonly delivery: {
      readonly lead: string;
    };
    readonly pay: string;
    readonly unconfirmed: string;
    readonly bolt: {
      readonly note: string;
    };
    readonly note: string;
    readonly city: string;
    readonly cards: {
      readonly title: string;
      readonly meta: string;
      readonly text: string;
    };
    readonly blik: {
      readonly title: string;
      readonly meta: string;
      readonly need: string;
      readonly online: {
        readonly title: string;
        readonly text: string;
      };
      readonly till: {
        readonly title: string;
        readonly text: string;
      };
      readonly more: string;
    };
  };
  readonly pay: {
    readonly any: string;
    readonly card: string;
    readonly blik: string;
    readonly cash: string;
    readonly apple: string;
    readonly google: string;
    readonly paypal: string;
  };
  readonly card: {
    readonly title: string;
    readonly lead: string;
    readonly brandAlt: string;
    readonly brandMark: string;
    readonly openOfficial: (name: string) => string;
  };
  readonly resident: {
    readonly title: string;
    readonly lead: string;
    readonly openOfficial: (name: string) => string;
  };
  readonly links: {
    readonly airportBuses: string;
    readonly airportTrains: string;
    readonly ztmSchedule: string;
    readonly skmSearch: string;
    readonly kartaTurysty: string;
    readonly pysznePayment: string;
    readonly blikHow: string;
  };
}

// G16.03 (issue #74) — the voluntary private rating words (20 §7, 21 §5/§6):
// the End invitation, the shared rating form, the honest delivery states and
// the My KUDY own-ratings list. The delivery-state words carry the §5.4
// distinction the person must see: saved on the device is not sent, a delete
// that has not reached the server says so.
export interface FeedbackStrings {
  // The feedback service's honest absence (no driver/sync port — the root's
  // rule) and an unparseable form route target.
  readonly unavailable: string;
  readonly invalidTarget: string;
  // The two 20 §7 questions: the guide's whole experience, the place's
  // physical worth. The form's facts line names the rated identity — the
  // content locale and the pinned version, never a fresh-catalog fact.
  readonly formTitleGuide: string;
  readonly formTitlePlace: string;
  readonly targetLine: (locale: string, version: string) => string;
  readonly scaleHint: string;
  readonly starLabel: (score: number) => string;
  readonly reasonsTitle: string;
  // The closed 21 §5.1 reason vocabulary of both kinds; an unknown code
  // renders as-is (the runMapReason idiom).
  readonly reasonText: Record<string, string>;
  // The versioned purpose disclosure (21 §6): who sees the rating, that it
  // is never public, and that it is separate from the analytics consent.
  readonly disclosureTitle: string;
  readonly disclosureBody: string;
  readonly disclosureAnalytics: string;
  readonly send: string;
  readonly deleteButton: string;
  readonly resolveConflict: string;
  readonly stateDraft: string;
  readonly statePending: string;
  readonly stateSent: string;
  readonly stateConflict: string;
  readonly stateActionRequired: string;
  readonly stateDeletePending: string;
  // The named synchronous-failure rules (FeedbackErrorRule) in words; an
  // unknown rule renders raw (the runMapReason fallback idiom).
  readonly errorText: Record<string, string>;
  // The End invitation (20 §7: quiet, non-modal, once per session) and the
  // place card's explicit action with the self-reported visit confirmation.
  readonly inviteTitle: string;
  readonly inviteRate: string;
  readonly inviteDismiss: string;
  readonly ratePlace: string;
  readonly placeVisitTitle: string;
  readonly placeVisitBody: string;
  readonly placeVisitAccept: string;
  // The My KUDY own-ratings list (the «пазней у My KUDY» path of 20 §7).
  readonly mySection: string;
  readonly myEmpty: string;
  readonly myEdit: string;
  readonly guideWord: string;
  readonly placeWord: string;
  readonly ratingOf: (score: number) => string;
}
