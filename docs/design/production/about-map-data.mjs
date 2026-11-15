// «Пра горад», раздзел city: the data of the illustrated map of the Tricity.
//
// Everything with a place on the map is stored in geographic coordinates
// [longitude, latitude]; the picture is tied to them by ANCHORS, so a better
// base picture later needs new anchors, not new data.
//
// The base picture (about-map.webp) is the map from the owner's target screen
// for #248 (a drawn, readable map), with its painted rail lines, stations and
// coloured patches removed by tools/about-map-clean.py. It is not to scale:
// the centre of Gdańsk and its port are drawn two to three times wider than
// they are, so the map bends the ground onto the picture through many anchors
// (about-map-geo.mjs), not by one straight scale.
//
// ZONES follow the owner's list of 2026-11-15 (#248): where to go and where it
// is handy to stay. A zone is a free outline of a few points; the map draws a
// smooth shape through them. Places to stay keep close to the trains and
// trams (the owner's rule: about 1 km to SKM at most) and do not take a whole
// district with houses far from transport. The outlines are drawn from
// knowledge of the city, not from survey data: they show the area, not its
// exact borders.
// STATIONS: coordinates from PKP Portal Pasażera as collected for #248.
// The planned PKM Południe stops are approximate (PKM Południe project pages).

// The base picture. `width` and `height` are the units every px coordinate
// of this file is in; the file itself has `density` pixels per unit, so it
// stays sharp when the map is zoomed in.
export const MAP_IMAGE = { src: 'about-map.webp', width: 892, height: 971, density: 3 };

// Points found both on the picture (px) and on the ground. `ref` is a stop
// of STATIONS or the AIRPORT; the others name what they are. On the picture
// they are the station signs it was drawn with, the airport sign, the piers,
// the cliff, the port entrance and the Motława bend. Landmark coordinates of
// the old town: content/discovery/places.json.
export const ANCHORS = [
  { ref: 'gdynia-glowna', px: [372.9, 152.5] },
  { what: 'Gdynia, Skwer Kościuszki', at: [18.5420, 54.5182], px: [420, 188] },
  { what: 'Gdynia, Molo Południowe (tip)', at: [18.5577, 54.5167], px: [464, 196] },
  { what: 'Orłowo cliff', at: [18.5658, 54.4858], px: [432, 272] },
  { what: 'Orłowo pier', at: [18.5640, 54.4795], px: [423, 296] },
  { ref: 'sopot', px: [407.5, 414.6] },
  { what: 'Sopot pier (land end)', at: [18.5700, 54.4466], px: [430, 396] },
  { ref: 'zabianka', px: [422.1, 484.4] },
  { what: 'Brzeźno pier (land end)', at: [18.6253, 54.4115], px: [585, 518] },
  { what: 'port entrance', at: [18.6650, 54.4100], px: [672, 540] },
  { what: 'Westerplatte', at: [18.6693, 54.4068], px: [700, 556] },
  { ref: 'wrzeszcz', px: [480.8, 595.0] },
  { ref: 'glowny', px: [559.7, 664.7] },
  { what: 'Town Hall, Długi Targ', at: [18.6533, 54.3489], px: [604, 702] },
  { what: 'Żuraw on the Motława', at: [18.6577, 54.3506], px: [628, 692] },
  { ref: 'srodmiescie', px: [556.2, 731.3] },
  { ref: 'airport', px: [250, 620] },
  { ref: 'kowale', px: [353, 899.7] },
];

// Railway stops. `main` stops are named on the map from a smaller zoom.
export const STATIONS = [
  { id: 'gdynia-glowna', name: 'Gdynia Główna', at: [18.52930, 54.52086], main: true },
  { id: 'wzgorze', name: 'Gdynia Wzgórze św. Maksymiliana', at: [18.53539, 54.50748] },
  { id: 'orlowo', name: 'Gdynia Orłowo', at: [18.54758, 54.47794], main: true },
  { id: 'kamienny-potok', name: 'Sopot Kamienny Potok', at: [18.55351, 54.45754] },
  { id: 'sopot', name: 'Sopot', at: [18.56177, 54.44181], main: true },
  { id: 'wyscigi', name: 'Sopot Wyścigi', at: [18.56503, 54.43166] },
  { id: 'zabianka', name: 'Gdańsk Żabianka-AWFiS', at: [18.56843, 54.42061] },
  { id: 'oliwa', name: 'Gdańsk Oliwa', at: [18.57194, 54.40950], main: true },
  { id: 'przymorze', name: 'Gdańsk Przymorze-Uniwersytet', at: [18.57645, 54.40076] },
  { id: 'zaspa', name: 'Gdańsk Zaspa', at: [18.59116, 54.38992] },
  { id: 'wrzeszcz', name: 'Gdańsk Wrzeszcz', at: [18.60510, 54.38200], main: true, change: true },
  { id: 'glowny', name: 'Gdańsk Główny', at: [18.64393, 54.35539], main: true },
  { id: 'srodmiescie', name: 'Gdańsk Śródmieście', at: [18.64440, 54.34645], main: true },
  { id: 'strzyza', name: 'Gdańsk Strzyża', at: [18.57835, 54.39153] },
  { id: 'niedzwiednik', name: 'Gdańsk Niedźwiednik', at: [18.57182, 54.37768] },
  { id: 'bretowo', name: 'Gdańsk Brętowo', at: [18.57366, 54.36539] },
  { id: 'jasien', name: 'Gdańsk Jasień', at: [18.55068, 54.35384] },
  { id: 'kielpinek', name: 'Gdańsk Kiełpinek', at: [18.52888, 54.35531] },
  { id: 'matarnia', name: 'Gdańsk Matarnia', at: [18.50654, 54.37337] },
  { id: 'firoga', name: 'Gdańsk Firoga', at: [18.48743, 54.37828] },
  { id: 'port-lotniczy', name: 'Gdańsk Port Lotniczy', at: [18.46683, 54.38267], main: true },
  { id: 'rebiechowo', name: 'Gdańsk Rębiechowo', at: [18.44693, 54.38730] },
  { id: 'orunskie', name: 'Oruńskie Przedmieście', at: [18.6340, 54.3350], planned: true },
  { id: 'chelm', name: 'Chełm', at: [18.6180, 54.3270], planned: true },
  { id: 'orunia-gorna', name: 'Orunia Górna', at: [18.6030, 54.3160], planned: true },
  { id: 'mackowy', name: 'Maćkowy', at: [18.5865, 54.3090], planned: true },
  { id: 'lostowice', name: 'Łostowice', at: [18.5740, 54.3050], planned: true },
  { id: 'kowale', name: 'Kowale', at: [18.5530, 54.3060], planned: true },
];

// Lines as stops in order. `beyond` draws the line on past its last stop
// towards where it really goes (direction only, no stops): SKM runs on north
// of Gdynia Główna. Rail between stops is drawn straight: schematic, not track.
export const LINES = [
  {
    id: 'skm', layer: 'rail', name: 'SKM',
    stops: ['srodmiescie', 'glowny', 'wrzeszcz', 'zaspa', 'przymorze', 'oliwa', 'zabianka', 'wyscigi', 'sopot',
      'kamienny-potok', 'orlowo', 'wzgorze', 'gdynia-glowna'],
    beyond: [18.5178, 54.5335],
  },
  {
    id: 'pkm', layer: 'rail', name: 'PKM',
    stops: ['wrzeszcz', 'strzyza', 'niedzwiednik', 'bretowo', 'jasien', 'kielpinek', 'matarnia', 'firoga', 'port-lotniczy', 'rebiechowo'],
  },
  {
    id: 'plan', layer: 'plan', name: 'PKM Południe',
    stops: ['srodmiescie', 'orunskie', 'chelm', 'orunia-gorna', 'mackowy', 'lostowice', 'kowale'],
  },
];

// The airport sign is part of the picture: the map makes it pressable where
// it is drawn (`px`).
export const AIRPORT = { id: 'airport', name: 'Port Lotniczy Gdańsk', code: 'GDN', at: [18.46611, 54.37750], px: [250, 620] };

// The zones (see the head of the file). `text` is the key of why it is good,
// `ways` of how to get there (about-content.mjs PLACE_WAYS).
export const ZONES = [
  // Where to go.
  { id: 'glowne', kind: 'visit', name: 'Główne Miasto', text: 'place.glowne', ways: 'glowne',
    outline: [[18.6458, 54.3531], [18.6528, 54.3537], [18.6584, 54.3526], [18.6593, 54.3492], [18.6586, 54.3462], [18.6521, 54.3456], [18.6463, 54.3461], [18.6452, 54.3496]] },
  { id: 'stare', kind: 'visit', name: 'Stare Miasto', text: 'zone.stare',
    outline: [[18.6456, 54.3537], [18.6460, 54.3576], [18.6492, 54.3606], [18.6544, 54.3613], [18.6584, 54.3591], [18.6589, 54.3541], [18.6527, 54.3539]] },
  { id: 'przedmiescie', kind: 'visit', name: 'Stare Przedmieście', text: 'zone.przedmiescie',
    outline: [[18.6460, 54.3454], [18.6522, 54.3452], [18.6586, 54.3458], [18.6596, 54.3431], [18.6561, 54.3404], [18.6491, 54.3399], [18.6455, 54.3424]] },
  { id: 'dolne', kind: 'visit', name: 'Dolne Miasto', text: 'zone.dolne',
    outline: [[18.6604, 54.3479], [18.6661, 54.3486], [18.6716, 54.3470], [18.6722, 54.3436], [18.6671, 54.3417], [18.6611, 54.3427]] },
  { id: 'westerplatte', kind: 'visit', name: 'Westerplatte', text: 'zone.westerplatte', ways: 'westerplatte',
    outline: [[18.6664, 54.4104], [18.6721, 54.4087], [18.6746, 54.4046], [18.6701, 54.4029], [18.6659, 54.4061]] },
  { id: 'park-oliwa', kind: 'visit', name: 'Park Oliwski', text: 'place.oliwa', ways: 'oliwa',
    outline: [[18.5587, 54.4123], [18.5616, 54.4136], [18.5661, 54.4129], [18.5669, 54.4104], [18.5629, 54.4091], [18.5594, 54.4099]] },
  { id: 'sopot', kind: 'visit', name: 'Sopot', text: 'place.sopot',
    outline: [[18.5591, 54.4517], [18.5662, 54.4522], [18.5703, 54.4471], [18.5744, 54.4405], [18.5763, 54.4372], [18.5651, 54.4366], [18.5626, 54.4410], [18.5606, 54.4468]] },
  { id: 'gdynia', kind: 'visit', name: 'Gdynia', text: 'place.gdynia',
    outline: [[18.5318, 54.5213], [18.5421, 54.5196], [18.5482, 54.5191], [18.5584, 54.5173], [18.5579, 54.5159], [18.5481, 54.5167], [18.5421, 54.5160], [18.5389, 54.5128], [18.5361, 54.5133], [18.5376, 54.5180], [18.5316, 54.5196]] },
  { id: 'brzezno', kind: 'visit', name: 'Molo w Brzeźnie', text: 'place.brzezno', ways: 'brzezno',
    outline: [[18.6219, 54.4108], [18.6244, 54.4136], [18.6276, 54.4131], [18.6291, 54.4108], [18.6256, 54.4097]] },
  { id: 'politechnika', kind: 'visit', name: 'Politechnika Gdańska', text: 'zone.politechnika',
    outline: [[18.6124, 54.3736], [18.6181, 54.3749], [18.6236, 54.3726], [18.6226, 54.3694], [18.6161, 54.3687], [18.6119, 54.3706]] },
  // Where it is handy to stay.
  { id: 'centrum', kind: 'stay', name: 'Główne i Stare Miasto', text: 'zone.centrum', ways: 'glowne',
    outline: [[18.6451, 54.3462], [18.6449, 54.3540], [18.6458, 54.3580], [18.6493, 54.3610], [18.6546, 54.3616], [18.6590, 54.3592], [18.6597, 54.3490], [18.6588, 54.3458], [18.6520, 54.3452]] },
  { id: 'nowe-ogrody', kind: 'stay', name: 'Nowe Ogrody', text: 'zone.nowe-ogrody',
    outline: [[18.6304, 54.3524], [18.6379, 54.3541], [18.6437, 54.3527], [18.6442, 54.3471], [18.6389, 54.3462], [18.6311, 54.3477]] },
  { id: 'dlugie-ogrody', kind: 'stay', name: 'Długie Ogrody', text: 'zone.dlugie-ogrody',
    outline: [[18.6606, 54.3524], [18.6681, 54.3531], [18.6758, 54.3511], [18.6761, 54.3487], [18.6679, 54.3483], [18.6607, 54.3490]] },
  { id: 'kartuska', kind: 'stay', name: 'Kartuska', text: 'zone.kartuska',
    outline: [[18.6352, 54.3470], [18.6290, 54.3462], [18.6201, 54.3446], [18.6102, 54.3431], [18.6058, 54.3426], [18.6061, 54.3404], [18.6109, 54.3405], [18.6208, 54.3420], [18.6300, 54.3438], [18.6358, 54.3449]] },
  { id: 'siedlce', kind: 'stay', name: 'Siedlce', text: 'zone.siedlce',
    outline: [[18.6131, 54.3532], [18.6205, 54.3549], [18.6268, 54.3541], [18.6296, 54.3510], [18.6281, 54.3481], [18.6215, 54.3476], [18.6146, 54.3484], [18.6108, 54.3505]] },
  { id: 'powstancow', kind: 'stay', name: 'Powstańców Warszawskich', text: 'zone.powstancow',
    outline: [[18.6168, 54.3398], [18.6232, 54.3401], [18.6270, 54.3383], [18.6251, 54.3357], [18.6190, 54.3351], [18.6150, 54.3374]] },
  { id: 'chelm', kind: 'stay', name: 'Chełm', text: 'zone.chelm',
    outline: [[18.6160, 54.3340], [18.6250, 54.3346], [18.6301, 54.3318], [18.6271, 54.3271], [18.6191, 54.3251], [18.6144, 54.3291]] },
  { id: 'orunia-gorna', kind: 'stay', name: 'Orunia Górna i Świętokrzyska', text: 'zone.orunia-gorna',
    outline: [[18.5958, 54.3204], [18.6079, 54.3201], [18.6106, 54.3151], [18.6001, 54.3089], [18.5879, 54.3061], [18.5829, 54.3096], [18.5899, 54.3149]] },
  { id: 'wrzeszcz', kind: 'stay', name: 'Wrzeszcz', text: 'zone.wrzeszcz', ways: 'wrzeszcz',
    outline: [[18.5975, 54.3915], [18.6080, 54.3868], [18.6175, 54.3815], [18.6230, 54.3778], [18.6175, 54.3745], [18.6075, 54.3780], [18.5985, 54.3822], [18.5925, 54.3860]] },
  { id: 'przymorze', kind: 'stay', name: 'Przymorze', text: 'zone.przymorze',
    outline: [[18.5786, 54.4068], [18.5860, 54.4076], [18.5915, 54.4040], [18.5912, 54.3995], [18.5850, 54.3972], [18.5790, 54.3988]] },
  { id: 'sopot-west', kind: 'stay', name: 'Górny Sopot', text: 'zone.sopot-west',
    outline: [[18.5597, 54.4494], [18.5601, 54.4441], [18.5621, 54.4381], [18.5561, 54.4371], [18.5501, 54.4401], [18.5491, 54.4461], [18.5531, 54.4499]] },
  { id: 'wzgorze', kind: 'stay', name: 'Wzgórze św. Maksymiliana', text: 'zone.wzgorze',
    outline: [[18.5281, 54.5114], [18.5381, 54.5119], [18.5441, 54.5079], [18.5421, 54.5031], [18.5331, 54.5026], [18.5271, 54.5061]] },
];
