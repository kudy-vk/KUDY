import { el, icon, mountBoard } from '../../../production/kit.mjs';

const proposal = {
  a: { back: 'arrow-left', backStyle: 'bare', walk: 'footprints', walkStyle: 'filled' },
  b: { back: 'arrow-left', backStyle: 'outline', walk: 'footprints', walkStyle: 'outline' },
  c: { back: 'arrow-left', backStyle: 'tinted', walk: 'navigation', walkStyle: 'tinted squared' },
};

// Localized fixture copy for every locale exposed by the shared board. The real
// Back/Walk/Resume accessible names still come from contracts/ui-messages.
const copyByLocale = {
  be: {
    title: 'Падрабязнасці маршруту па Гданьску',
    active: 'Прагулка ідзе', paused: 'Прагулка на паўзе', none: 'Няма прагулкі',
    infoLabel: 'Інфармацыя', infoEvent: 'Адкрыць звесткі пра экран.',
    backEvent: 'Назад: вяртанне на папярэдні экран без спынення прагулкі або аўдыё.',
    walkEvent: 'Прагулка: вяртанне да папярэдняга стану панэлі без запуску гуку.',
    narrowNote: 'На 320 dp з буйным тэкстам дадатковая кнопка схавана ў макеце. Яе месца трэба яшчэ ўзгадніць.',
  },
  en: {
    title: 'Details of the Gdańsk walking route',
    active: 'Walk active', paused: 'Walk paused', none: 'No walk',
    infoLabel: 'Information', infoEvent: 'Open screen information.',
    backEvent: 'Back: return to the previous screen without stopping the walk or audio.',
    walkEvent: 'Walk: return to the previous panel state without starting audio.',
    narrowNote: 'At 320 dp with large text, the extra action is hidden in this demo. Its placement still needs approval.',
  },
  uk: {
    title: 'Подробиці маршруту Гданськом',
    active: 'Прогулянка триває', paused: 'Прогулянку призупинено', none: 'Немає прогулянки',
    infoLabel: 'Інформація', infoEvent: 'Відкрити інформацію про екран.',
    backEvent: 'Назад: повернутися на попередній екран, не зупиняючи прогулянку чи аудіо.',
    walkEvent: 'Прогулянка: повернути попередній стан панелі без запуску аудіо.',
    narrowNote: 'На 320 dp з великим текстом додаткову кнопку приховано в макеті. Її розташування ще треба узгодити.',
  },
  de: {
    title: 'Details zum Stadtrundgang durch Danzig',
    active: 'Rundgang läuft', paused: 'Rundgang pausiert', none: 'Kein Rundgang',
    infoLabel: 'Informationen', infoEvent: 'Informationen zum Bildschirm öffnen.',
    backEvent: 'Zurück: zum vorherigen Bildschirm, ohne Rundgang oder Audio zu stoppen.',
    walkEvent: 'Rundgang: vorherigen Panelzustand wiederherstellen, ohne Audio zu starten.',
    narrowNote: 'Bei 320 dp und großer Schrift wird die Zusatzaktion im Entwurf ausgeblendet. Ihre Platzierung ist noch offen.',
  },
  es: {
    title: 'Detalles de la ruta a pie por Gdańsk',
    active: 'Recorrido en curso', paused: 'Recorrido en pausa', none: 'Sin recorrido',
    infoLabel: 'Información', infoEvent: 'Abrir información de la pantalla.',
    backEvent: 'Atrás: volver a la pantalla anterior sin detener el recorrido ni el audio.',
    walkEvent: 'Recorrido: volver al estado anterior del panel sin iniciar el audio.',
    narrowNote: 'Con 320 dp y texto grande, la acción adicional se oculta en esta maqueta. Falta decidir su ubicación.',
  },
  fr: {
    title: 'Détails du parcours à pied dans Gdańsk',
    active: 'Parcours en cours', paused: 'Parcours en pause', none: 'Aucun parcours',
    infoLabel: 'Informations', infoEvent: 'Ouvrir les informations de cet écran.',
    backEvent: 'Retour : revenir à l’écran précédent sans arrêter le parcours ni l’audio.',
    walkEvent: 'Parcours : retrouver l’état précédent du panneau sans lancer l’audio.',
    narrowNote: 'À 320 dp avec un grand texte, l’action supplémentaire est masquée dans cette maquette. Son emplacement reste à valider.',
  },
  cs: {
    title: 'Podrobnosti pěší trasy v Gdaňsku',
    active: 'Procházka probíhá', paused: 'Procházka pozastavena', none: 'Žádná procházka',
    infoLabel: 'Informace', infoEvent: 'Otevřít informace o obrazovce.',
    backEvent: 'Zpět: návrat na předchozí obrazovku bez zastavení procházky či zvuku.',
    walkEvent: 'Procházka: návrat k předchozímu stavu panelu bez spuštění zvuku.',
    narrowNote: 'Při 320 dp a velkém písmu je další akce v maketě skrytá. Její umístění se ještě musí schválit.',
  },
  sv: {
    title: 'Detaljer om promenadrutten i Gdańsk',
    active: 'Promenaden pågår', paused: 'Promenaden pausad', none: 'Ingen promenad',
    infoLabel: 'Information', infoEvent: 'Öppna information om skärmen.',
    backEvent: 'Tillbaka: återgå till föregående skärm utan att stoppa promenaden eller ljudet.',
    walkEvent: 'Promenad: återgå till panelens tidigare läge utan att starta ljud.',
    narrowNote: 'Vid 320 dp och stor text döljs den extra åtgärden i skissen. Placeringen behöver godkännas.',
  },
  nb: {
    title: 'Detaljer om vandreruten i Gdańsk',
    active: 'Vandring pågår', paused: 'Vandring satt på pause', none: 'Ingen vandring',
    infoLabel: 'Informasjon', infoEvent: 'Åpne informasjon om skjermen.',
    backEvent: 'Tilbake: gå til forrige skjerm uten å stoppe vandringen eller lyden.',
    walkEvent: 'Vandring: gå tilbake til forrige paneltilstand uten å starte lyd.',
    narrowNote: 'Ved 320 dp og stor tekst skjules ekstrahandlingen i skissen. Plasseringen må fortsatt godkjennes.',
  },
  pl: {
    title: 'Szczegóły trasy spaceru po Gdańsku',
    active: 'Spacer trwa', paused: 'Spacer wstrzymany', none: 'Brak spaceru',
    infoLabel: 'Informacje', infoEvent: 'Otwórz informacje o ekranie.',
    backEvent: 'Wstecz: wróć do poprzedniego ekranu bez zatrzymywania spaceru ani dźwięku.',
    walkEvent: 'Spacer: wróć do poprzedniego stanu panelu bez uruchamiania dźwięku.',
    narrowNote: 'Przy 320 dp i dużym tekście dodatkowy przycisk jest ukryty w makiecie. Jego położenie wymaga decyzji.',
  },
  da: {
    title: 'Detaljer om gåturen i Gdańsk',
    active: 'Turen er i gang', paused: 'Turen er sat på pause', none: 'Ingen tur',
    infoLabel: 'Information', infoEvent: 'Åbn oplysninger om skærmen.',
    backEvent: 'Tilbage: gå til forrige skærm uden at stoppe turen eller lyden.',
    walkEvent: 'Tur: vend tilbage til panelets tidligere tilstand uden at starte lyd.',
    narrowNote: 'Ved 320 dp og stor tekst er den ekstra handling skjult i denne skitse. Placeringen skal stadig godkendes.',
  },
  nl: {
    title: 'Details van de wandelroute door Gdańsk',
    active: 'Wandeling bezig', paused: 'Wandeling gepauzeerd', none: 'Geen wandeling',
    infoLabel: 'Informatie', infoEvent: 'Scherminformatie openen.',
    backEvent: 'Terug: naar het vorige scherm zonder de wandeling of audio te stoppen.',
    walkEvent: 'Wandeling: terug naar de vorige paneelstatus zonder audio te starten.',
    narrowNote: 'Bij 320 dp en grote tekst is de extra actie in dit ontwerp verborgen. De plaatsing moet nog worden goedgekeurd.',
  },
  pt: {
    title: 'Detalhes do percurso a pé em Gdańsk',
    active: 'Passeio em curso', paused: 'Passeio em pausa', none: 'Sem passeio',
    infoLabel: 'Informações', infoEvent: 'Abrir informações sobre o ecrã.',
    backEvent: 'Voltar: regressar ao ecrã anterior sem parar o passeio nem o áudio.',
    walkEvent: 'Passeio: voltar ao estado anterior do painel sem iniciar o áudio.',
    narrowNote: 'Com 320 dp e texto grande, a ação extra fica oculta nesta maquete. A sua posição ainda precisa de aprovação.',
  },
};

const trueRunState = (state) => state.walk === 'active' || state.walk === 'paused';
const visibleShortcut = (state) => trueRunState(state) && state.screen !== 'run';

function viewProps(state, strings) {
  const copy = copyByLocale[state.locale];
  if (!copy) throw new Error('Unsupported review locale: ' + state.locale);
  const variant = proposal[state.variant];
  if (!variant) throw new Error('Unsupported review variant: ' + state.variant);
  return {
    copy,
    variant,
    isRun: state.screen === 'run',
    shortcut: visibleShortcut(state),
    title: state.screen === 'run' ? strings['native.chrome.walk'] : copy.title,
    labelBack: strings['native.chrome.back'],
    labelWalk: strings['native.place.resumeLabel'] + ' · ' + strings['native.chrome.walk'],
    status: copy[state.walk],
  };
}

function control(name, style, label, message, say) {
  const node = el('button', { type: 'button', className: 'control ' + style, title: label },
    el('span', { className: 'circle' }, icon(name, 22)));
  node.setAttribute('aria-label', label);
  node.addEventListener('click', () => say(message));
  return node;
}

if (typeof document !== 'undefined') {
  await mountBoard({
    controls: [
      { id: 'variant', label: 'Варыянт', options: [['a', 'A · Класічны'], ['b', 'B · Сіметрычны'], ['c', 'C · Куты']] },
      { id: 'walk', label: 'Стан прагулкі', options: [['active', 'Ідзе'], ['paused', 'На паўзе'], ['none', 'Няма / завершана']] },
      { id: 'screen', label: 'Экран', options: [['other', 'Унутраны экран'], ['run', 'Run']] },
      { id: 'extra', label: 'Яшчэ кнопка', options: [['yes', 'Ёсць (info)'], ['no', 'Няма']] },
    ],
    stringIds: ['native.chrome.back', 'native.chrome.walk', 'native.place.resumeLabel'],
    build({ body, state, strings, say }) {
      const { copy, variant, isRun, shortcut, title, labelBack, labelWalk, status } = viewProps(state, strings);
      const bar = el('header', { className: 'proposal-header variant-' + state.variant });
      bar.append(control(variant.back, variant.backStyle, labelBack, copy.backEvent, say));
      const heading = el('h2', { className: 'title', textContent: title, title });
      bar.append(heading);

      // A narrow header hides the optional action only in this unapproved demo.
      const narrow = Number(state.device.split('x')[0]) === 320 && Number(state.scale) > 1;
      if (state.extra === 'yes' && !narrow && !isRun) {
        bar.append(control('info', 'more', copy.infoLabel, copy.infoEvent, say));
      }
      if (shortcut) {
        bar.append(control(variant.walk, variant.walkStyle, labelWalk, copy.walkEvent, say));
      }
      body.append(bar);
      const context = el('section', { className: 'screen-example' },
        el('span', { className: 'eyebrow', textContent: 'KUDY · UI-REVIEW-02' }),
        el('span', { className: 'state-pill', textContent: status }),
        el('div', { className: 'card' },
          el('strong', { textContent: title }),
          el('div', { className: 'line' }),
          el('div', { className: 'line short' }),
          el('div', { className: 'line' })));
      body.append(context);
      if (narrow && state.extra === 'yes' && !isRun) {
        body.append(el('p', { className: 't-small', style: 'padding:0 20px;' }, copy.narrowNote));
      }
    },
  });
}

export { visibleShortcut, proposal, copyByLocale, viewProps };
