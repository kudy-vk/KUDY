# Каталог музеяў для макета #257 — крыніцы апісанняў

Статус: **працоўны змест, не зацверджаны для дадатку**. Даследаванне ад 2026-11-17. Адбор аб'ектаў і лакальныя фармулёўкі — рэдакцыйнае рашэнне для праверкі ўладальнікам.

## Дзе знойдзена ранейшае даследаванне

- **Selfer / Gdańsk Base**: праект Supabase `Selfer`, табліца `public.gdansk`, 9 851 запіс. Для асноўных музеяў знойдзены артыкулы `kind='article'`: `MUZEUM II WOJNY ŚWIATOWEJ`, `EUROPEJSKIE CENTRUM SOLIDARNOŚCI (ECS)`, `MUZEUM GDAŃSKA`, `DWÓR ARTUSA` і інш. Гэта асобны корпус, а не звычайны пералік дакументаў «Куфра».
- **Лакальная копія KB**: `/home/viktar/Projects/Tool-Lib/gdansk-base/articles/`; у тым ліку файлы `MUZEUM II WOJNY ŚWIATOWEJ/MUZEUM II WOJNY ŚWIATOWEJ.txt`, `EUROPEJSKIE CENTRUM SOLIDARNOŚCI (ECS)/EUROPEJSKIE CENTRUM SOLIDARNOŚCI (ECS).txt`, `DWÓR ARTUSA/DWÓR ARTUSA.txt`, `MUZEUM GDAŃSKA/MUZEUM GDAŃSKA.txt`, `ŻURAW/ŻURAW.txt`, `RATUSZ GŁÓWNEGO MIASTA/RATUSZ GŁÓWNEGO MIASTA.txt`, `MUZEUM NARODOWE/MUZEUM NARODOWE.txt`.
- **Даследаванне KUDY #200**: `docs/content/about-city-knowledge.md`, `docs/content/about-city-sources.md` і `docs/agent-tasks/results/200.md`; там больш пераменных пра картку і бясплатныя дні, якія **не трэба** капіраваць у інтэрфейс.

## Кароткія апісанні і афіцыйныя сайты

| Музей | Кароткі сэнс (для інтэрфейсу) | Далейшая праверка |
|---|---|---|
| Музей ІІ сусветнай вайны | Лёсы звычайных людзей у гады вайны | [Афіцыйны музей](https://www.muzeum1939.pl/) · Gedanopedia: `MUZEUM II WOJNY ŚWIATOWEJ` |
| Музей бурштыну | Прыродны бурштын і мастацтва | [Muzeum Gdańska](https://muzeumgdansk.pl/oddzialy-muzeum/muzeum-bursztynu/) · [віртуальны агляд](https://wirtualne.muzeumgdansk.pl/oddzialy/muzeum-bursztynu-w-wielkim-mlynie) |
| Еўрапейскі цэнтр салідарнасці | Страйкі і рух да свабоды | [Пастаянная выстава ECS](https://ecs.gda.pl/wystawa-stala/) · Gedanopedia: `EUROPEJSKIE CENTRUM SOLIDARNOŚCI (ECS)` |
| Журав — партовы кран | Сярэднявечны кран і марскі гандаль | [Narodowe Muzeum Morskie](https://nmm.pl/zuraw/) · Gedanopedia: `ŻURAW` |
| Нацыянальны марскі музей | Судны і археалогія мараходства | [Музей на Алавянцы](https://nmm.pl/narodowe-muzeum-morskie/historia-spichlerzy-na-olowiance/) |
| Ратуша Галоўнага горада | Парадныя інтэр'еры і гісторыя горада | [Muzeum Gdańska](https://muzeumgdansk.pl/oddzialy-muzeum/ratusz-glownego-miasta/) · Gedanopedia: `RATUSZ GŁÓWNEGO MIASTA` |
| Двор Артуса | Купецкія братэрствы і гданьскі росквіт | [Muzeum Gdańska](https://muzeumgdansk.pl/oddzialy-muzeum/dwor-artusa/) · Gedanopedia: `DWÓR ARTUSA` |
| Цэнтр марской культуры | Інтэрактыўны свет мора | [Narodowe Muzeum Morskie](https://nmm.pl/osrodek-kultury-morskiej/) |
| Нацыянальны музей — старое мастацтва | Жывапіс і мастацкія рамёствы | [Музейныя зборы](https://www.mng.gda.pl/zbiory/) · Gedanopedia: `MUZEUM NARODOWE` |

**Асцярожна:** праца Ханса Мемлінга «Страшны суд» знята з публічнай экспазіцыі да канца 2026 года на час даследаванняў і падрыхтоўкі новага паказу ([музейная абвестка](https://www.mng.gda.pl/2025/02/05/sad-ostateczny-hansa-memlinga-przerwa-wystawiennicza/)). Таму не абяцаць, што яе абавязкова можна ўбачыць.

## Лагатып і рэйтынгі

**Лагатып:** у HTML-копіі адлюстроўваецца выява непасрэдна з афіцыйнага сайта `https://kartaturysty.visitgdansk.com/cmsImages/logoAplikacji.png`; калі няма сеткі ці выява не загрузілася, паказваецца тэкставая заглушка «KT». Перад пераносам у дадатак праверыць права на лакальнае ўбудаванне знака і афлайн-выкарыстанне; макет не прысвойвае брэнд KUDY.

**Ацэнкі Google Maps:** у HTML ёсць зорка-іконка з пераходам на пошук музея ў Google Maps (`https://www.google.com/maps/search/?api=1&query=…`). Лічбы рэйтынгу і водгукі **не капіруем і не захоўваем**. Калі ўладальнік выбера паказ рэйтынгаў у самім дадатку, для гэтага патрэбныя актуальныя даныя праз Google Places, атрыбуцыя і выкананне ўмоў выкарыстання: [Google Maps Places policies](https://developers.google.com/maps/documentation/places/web-service/policies), [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

**Месца рэалізацыі:** `docs/design/catalog-257.html` → `docs/design/production/about-257.html`; слоўнікі `about-257-words-be.mjs` / `about-257-words-en.mjs`, мадэль `about-257-content.mjs`. Кола, канон і галоўны каталог не перапісваліся. Усё да візуальнага вердыкту застаецца лакальным чарнавіком.

## Рэзерв для падборкі «Чым заняцца» пасля пераносу 2026-11-17

Тэксты захаваныя з ранейшага чарнавіка. Падборка не апублікаваная.

### Музей ІІ сусветнай вайны / Museum of the Second World War

**teaser BE:** Як вайна змяніла лёсы звычайных людзей.

**teaser EN:** How war changed the lives of ordinary people.

**detail BE:** Гісторыя вытокаў і наступстваў вайны, жыцця цывільных, супраціву і людскіх страт у шырокім еўрапейскім кантэксце.

**detail EN:** An exhibition about the causes and aftermath of war, civilians, resistance and personal stories across Europe.

Google Maps search: Muzeum II Wojny Światowej Gdańsk

### Музей бурштыну / Amber Museum

**teaser BE:** Бурштын і ювелірныя традыцыі Гданьска.

**teaser EN:** Amber and Gdańsk’s jewellery-making traditions.

**detail BE:** У гістарычным Вялікім млыне — прыродныя ўзоры бурштыну, уключэнні, старыя вырабы і сучаснае мастацтва.

**detail EN:** Inside the historic Great Mill: natural amber specimens, inclusions, historic pieces and contemporary amber art.

Google Maps search: Muzeum Bursztynu Wielkie Młyny Gdańsk

### Еўрапейскі цэнтр салідарнасці / European Solidarity Centre

**teaser BE:** Як «Салідарнасць» адкрывала шлях да свабоды.

**teaser EN:** How Solidarność helped open a path to freedom.

**detail BE:** Дакументы, прадметы і інтэрактыўная гісторыя жнівеньскіх страйкаў 1980 года і змен ва Усходняй Еўропе.

**detail EN:** Documents, objects and interactive stories about the strikes of August 1980 and changes across Eastern Europe.

Google Maps search: Europejskie Centrum Solidarności Gdańsk

### Журав — партовы кран / The Crane (Żuraw)

**teaser BE:** Сярэднявечная брама-кран над Мотлавай.

**teaser EN:** A medieval port crane and gate on the Motława.

**detail BE:** Адзін з сімвалаў Гданьска. Унутры — гісторыя порта, марскога гандлю і працы кранаўшчыкаў.

**detail EN:** An icon of Gdańsk, with displays about the port, maritime trade and the people who operated the crane.

Google Maps search: Żuraw Gdańsk Narodowe Muzeum Morskie

### Нацыянальны марскі музей / National Maritime Museum

**teaser BE:** Караблі, мора і марская археалогія.

**teaser EN:** Ships, seafaring and underwater archaeology.

**detail BE:** У былых свірнах на Алавянцы — мадэлі суднаў, знаходкі з караблекрушэнняў і гісторыя балтыйскага мараходства.

**detail EN:** In historic granaries on Ołowianka: ship models, wreck finds and the maritime history of the Baltic.

Google Maps search: Narodowe Muzeum Morskie Ołowianka Gdańsk

### Ратуша Галоўнага горада / Main Town Hall

**teaser BE:** Парадныя залы і гісторыя старога Гданьска.

**teaser EN:** Grand interiors and the history of old Gdańsk.

**detail BE:** Гістарычныя інтэр’еры, жывапіс, мэбля і мастацкае рамяство, звязаныя з гарадскім жыццём XVI–XVII стагоддзяў.

**detail EN:** Historic rooms, paintings, furniture and decorative crafts reflecting the city’s life in the 16th and 17th centuries.

Google Maps search: Ratusz Głównego Miasta Gdańsk Muzeum

### Двор Артуса / Artus Court

**teaser BE:** Купецкія брацтвы і багацце старога горада.

**teaser EN:** Merchant guilds and the wealth of old Gdańsk.

**detail BE:** Уражлівая зала, мастацтва і высокая кафляная печ нагадваюць пра часы, калі Гданьск быў буйным гандлёвым цэнтрам.

**detail EN:** A grand hall, artwork and a monumental tiled stove recall the city’s centuries as a thriving trading hub.

Google Maps search: Dwór Artusa Gdańsk muzeum

### Цэнтр марской культуры / Maritime Culture Centre

**teaser BE:** Марская справа ў інтэрактыўным фармаце.

**teaser EN:** Hands-on experiences with the world of the sea.

**detail BE:** Лодкі розных народаў і экспанаты, што дапамагаюць праз гульню зразумець працу порта, суднаў і марскіх тэхналогій.

**detail EN:** Boats from different cultures and interactive displays about ports, ships and maritime technology, also for families.

Google Maps search: Ośrodek Kultury Morskiej Gdańsk

### Нацыянальны музей — старое мастацтва / National Museum — Old Art

**teaser BE:** Жывапіс і рамёствы ў былым кляштары.

**teaser EN:** Painting and crafts in a former monastery.

**detail BE:** Калекцыі еўрапейскага жывапісу, скульптуры, мэблі і гданьскіх майстроў. Доступ да асобных шэдэўраў правярай на сайце.

**detail EN:** European paintings, sculpture, furniture and Gdańsk craftsmanship. Check the museum website for individual artworks on view.

Google Maps search: Muzeum Narodowe Gdańsk Oddział Sztuki Dawnej

