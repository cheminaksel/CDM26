/* =============================================================
   data.js — COUCHE DE DONNÉES (la seule à modifier)
   =============================================================

   SOURCES (toutes gratuites) :

   1) openfootball/worldcup.json  → VRAI calendrier des 104 matchs 2026,
      avec résultats et buteurs qui se remplissent pendant le tournoi.
      Gratuit, AUCUNE clé, fonctionne directement depuis le navigateur.

   2) API-Football (optionnel)    → scores EN DIRECT à la minute.
      Plan gratuit = 100 requêtes/jour. Colle ta clé gratuite ci-dessous
      (compte sur https://dashboard.api-football.com). Sans clé, le site
      marche quand même : le live est alors estimé à partir d'openfootball.

   3) "demo"                       → moteur simulé (pour tester hors-ligne).

   Format de match renvoyé :
     { id, status:'LIVE'|'UPCOMING'|'FINISHED', date, minute,
       stage, group, venue, city,
       home:{name,code,flag}, away:{name,code,flag},
       score:{home,away}, events:[{minute,type:'goal',team,player}] }
   ============================================================= */

const DataAPI = (() => {
  // ===========================================================
  //  CONFIGURATION
  // ===========================================================
  const SOURCE = "calendar";   // "calendar" (vrai) | "demo" (simulé)
  const USE_DEMO_FALLBACK = true; // bascule sur la démo si le calendrier ne charge pas

  const CALENDAR_URL =
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

  // (Optionnel) live à la minute via API-Football :
  const APIFOOTBALL_KEY = "";  // ← ta clé gratuite (laisse vide si tu n'en as pas)
  const APIFOOTBALL_HOST = "v3.football.api-sports.io";
  const WORLDCUP_LEAGUE_ID = 1; // identifiant Coupe du Monde dans API-Football
  const APIFOOTBALL_SEASON = 2026;

  const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  // ===========================================================
  //  MÉTA ÉQUIPES : nom anglais (openfootball) -> [nom FR, code, drapeau]
  // ===========================================================
  const TEAM = {
    "Mexico":["Mexique","MEX","🇲🇽"], "South Africa":["Afrique du Sud","RSA","🇿🇦"],
    "South Korea":["Corée du Sud","KOR","🇰🇷"], "Czech Republic":["République tchèque","CZE","🇨🇿"],
    "Canada":["Canada","CAN","🇨🇦"], "Qatar":["Qatar","QAT","🇶🇦"],
    "Switzerland":["Suisse","SUI","🇨🇭"], "Bosnia & Herzegovina":["Bosnie-Herzégovine","BIH","🇧🇦"],
    "Brazil":["Brésil","BRA","🇧🇷"], "Morocco":["Maroc","MAR","🇲🇦"],
    "Haiti":["Haïti","HAI","🇭🇹"], "Scotland":["Écosse","SCO","🏴󠁧󠁢󠁳󠁣󠁴󠁿"],
    "USA":["États-Unis","USA","🇺🇸"], "Paraguay":["Paraguay","PAR","🇵🇾"],
    "Australia":["Australie","AUS","🇦🇺"], "Turkey":["Turquie","TUR","🇹🇷"],
    "Germany":["Allemagne","GER","🇩🇪"], "Curaçao":["Curaçao","CUW","🇨🇼"],
    "Ivory Coast":["Côte d'Ivoire","CIV","🇨🇮"], "Ecuador":["Équateur","ECU","🇪🇨"],
    "Netherlands":["Pays-Bas","NED","🇳🇱"], "Japan":["Japon","JPN","🇯🇵"],
    "Tunisia":["Tunisie","TUN","🇹🇳"], "Sweden":["Suède","SWE","🇸🇪"],
    "Belgium":["Belgique","BEL","🇧🇪"], "Egypt":["Égypte","EGY","🇪🇬"],
    "Iran":["Iran","IRN","🇮🇷"], "New Zealand":["Nouvelle-Zélande","NZL","🇳🇿"],
    "Spain":["Espagne","ESP","🇪🇸"], "Cape Verde":["Cap-Vert","CPV","🇨🇻"],
    "Saudi Arabia":["Arabie saoudite","KSA","🇸🇦"], "Uruguay":["Uruguay","URU","🇺🇾"],
    "France":["France","FRA","🇫🇷"], "Iraq":["Irak","IRQ","🇮🇶"],
    "Senegal":["Sénégal","SEN","🇸🇳"], "Norway":["Norvège","NOR","🇳🇴"],
    "Argentina":["Argentine","ARG","🇦🇷"], "Algeria":["Algérie","ALG","🇩🇿"],
    "Austria":["Autriche","AUT","🇦🇹"], "Jordan":["Jordanie","JOR","🇯🇴"],
    "DR Congo":["RD Congo","COD","🇨🇩"], "Portugal":["Portugal","POR","🇵🇹"],
    "Uzbekistan":["Ouzbékistan","UZB","🇺🇿"], "Colombia":["Colombie","COL","🇨🇴"],
    "England":["Angleterre","ENG","🏴󠁧󠁢󠁥󠁮󠁧󠁿"], "Croatia":["Croatie","CRO","🇭🇷"],
    "Ghana":["Ghana","GHA","🇬🇭"], "Panama":["Panama","PAN","🇵🇦"]
  };

  // Transforme un nom d'équipe (ou un placeholder de phase finale) en objet équipe.
  function meta(name) {
    if (TEAM[name]) { const [n, c, f] = TEAM[name]; return { name: n, code: c, flag: f, en: name }; }
    return { name: prettyPlaceholder(name), code: "", flag: "🏳️", en: name, tbd: true };
  }
  // "1A"→"1er Gr. A", "2B"→"2e Gr. B", "3A/B/C"→"3e (A/B/C)", "W73"→"Vainqueur match 73"
  function prettyPlaceholder(s) {
    if (/^1[A-L]$/.test(s)) return "1er Gr. " + s[1];
    if (/^2[A-L]$/.test(s)) return "2e Gr. " + s[1];
    if (/^3[A-L/]+$/.test(s)) return "3e (" + s.slice(1) + ")";
    if (/^W\d+$/.test(s)) return "Vainqueur match " + s.slice(1);
    if (/^L\d+$/.test(s)) return "Perdant match " + s.slice(1);
    return s;
  }

  // Code FIFA -> code drapeau flagcdn (ISO 3166, + cas spéciaux GB).
  const ISO = {
    MEX:"mx", RSA:"za", KOR:"kr", CZE:"cz", CAN:"ca", BIH:"ba", QAT:"qa", SUI:"ch",
    BRA:"br", MAR:"ma", HAI:"ht", SCO:"gb-sct", USA:"us", PAR:"py", AUS:"au", TUR:"tr",
    GER:"de", CUW:"cw", CIV:"ci", ECU:"ec", NED:"nl", JPN:"jp", SWE:"se", TUN:"tn",
    BEL:"be", EGY:"eg", IRN:"ir", NZL:"nz", ESP:"es", CPV:"cv", KSA:"sa", URU:"uy",
    FRA:"fr", SEN:"sn", IRQ:"iq", NOR:"no", ARG:"ar", ALG:"dz", AUT:"at", JOR:"jo",
    POR:"pt", COD:"cd", UZB:"uz", COL:"co", ENG:"gb-eng", CRO:"hr", GHA:"gh", PAN:"pa"
  };

  // Renvoie le HTML d'un drapeau (image SVG flagcdn). Si le code est inconnu
  // (équipe pas encore connue en phase finale) ou si l'image échoue, on
  // retombe sur une pastille avec le code/ballon.
  function flagImg(team, cls) {
    const iso = ISO[team.code];
    const fallback = team.code || "⚽";
    if (!iso) return `<span class="${cls} flag-fallback">${fallback}</span>`;
    return `<img class="${cls} flag-img" src="https://flagcdn.com/${iso}.svg" alt="${team.name}" loading="lazy"`
      + ` onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'${cls} flag-fallback',textContent:'${fallback}'}))">`;
  }

  // Traduction des tours de phase finale.
  const ROUND_FR = {
    "Round of 32": "16e de finale", "Round of 16": "8e de finale",
    "Quarter-finals": "Quart de finale", "Quarter-final": "Quart de finale",
    "Semi-finals": "Demi-finale", "Semi-final": "Demi-finale",
    "Match for third place": "Petite finale", "Third place": "Petite finale",
    "Final": "Finale"
  };

  // ===========================================================
  //  UTILITAIRES
  // ===========================================================
  function slug(s) {
    return String(s).toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  function matchId(m) { return slug(m.date + "-" + m.team1 + "-" + m.team2); }

  // "2026-06-11" + "13:00 UTC-6" -> timestamp ms
  function kickoffMs(date, time) {
    if (!date) return Date.now();
    if (!time) return new Date(date + "T12:00:00Z").getTime();
    const mm = time.match(/(\d{1,2}):(\d{2})\s*UTC\s*([+-]\d{1,2})?/i);
    if (!mm) return new Date(date + "T12:00:00Z").getTime();
    const h = mm[1].padStart(2, "0"), min = mm[2];
    const sign = mm[3] ? mm[3][0] : "+";
    const off = mm[3] ? Math.abs(parseInt(mm[3], 10)) : 0;
    const offStr = sign + String(off).padStart(2, "0") + ":00";
    return new Date(`${date}T${h}:${min}:00${offStr}`).getTime();
  }

  function estMinute(elapsed) {
    const p = Math.floor(elapsed / MIN);
    if (p >= 95) return 90;
    if (p >= 45 && p < 60) return 45;       // mi-temps
    if (p >= 60) return Math.min(90, p - 15); // on retire la pause
    return Math.max(1, p);
  }

  // ===========================================================
  //  SOURCE 1 — CALENDRIER RÉEL (openfootball)
  // ===========================================================
  function mapCalendarMatch(m) {
    const id = matchId(m);
    const kickoff = kickoffMs(m.date, m.time);
    const home = meta(m.team1), away = meta(m.team2);
    const group = (m.group || "").replace(/^Group\s+/, "");
    const stage = group ? "Groupe " + group : (ROUND_FR[m.round] || m.round || "");

    const allEvents = [
      ...(m.goals1 || []).map(g => ({ minute: parseInt(g.minute, 10) || 0, type: "goal", team: "home", player: g.name })),
      ...(m.goals2 || []).map(g => ({ minute: parseInt(g.minute, 10) || 0, type: "goal", team: "away", player: g.name }))
    ].sort((a, b) => a.minute - b.minute);

    const hasFt = m.score && Array.isArray(m.score.ft);
    const elapsed = Date.now() - kickoff;

    let status, minute = null, score, events = allEvents;
    if (elapsed < 0) {
      status = "UPCOMING"; score = { home: 0, away: 0 }; events = [];
    } else if (hasFt) {
      status = "FINISHED"; minute = 90; score = { home: m.score.ft[0], away: m.score.ft[1] };
    } else if (elapsed < 140 * MIN) {
      // commencé mais pas de score final → en direct (minute estimée)
      status = "LIVE"; minute = estMinute(elapsed);
      events = allEvents.filter(e => e.minute <= minute);
      score = { home: 0, away: 0 }; events.forEach(e => score[e.team]++);
    } else {
      status = "FINISHED"; minute = 90;
      score = { home: (m.goals1 || []).length, away: (m.goals2 || []).length };
    }

    return {
      id, status, minute, date: kickoff,
      stage, group, venue: m.ground || "", city: "",
      home, away, score, events, round: m.round || ""
    };
  }

  let _calCache = null, _calTime = 0;
  async function fetchCalendar() {
    if (_calCache && Date.now() - _calTime < 20000) return _calCache; // cache 20 s
    const res = await fetch(CALENDAR_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("calendrier HTTP " + res.status);
    const json = await res.json();
    const matches = (json.matches || []).map(mapCalendarMatch);
    _calCache = matches; _calTime = Date.now();
    return matches;
  }

  // ===========================================================
  //  SOURCE 2 — LIVE À LA MINUTE (API-Football, optionnel)
  // ===========================================================
  async function fetchLive() {
    if (!APIFOOTBALL_KEY) return [];
    try {
      const res = await fetch(`https://${APIFOOTBALL_HOST}/fixtures?live=all`,
        { headers: { "x-apisports-key": APIFOOTBALL_KEY } });
      const j = await res.json();
      return (j.response || [])
        .filter(f => !WORLDCUP_LEAGUE_ID || f.league.id === WORLDCUP_LEAGUE_ID)
        .map(f => ({
          home: f.teams.home.name, away: f.teams.away.name,
          minute: f.fixture.status.elapsed,
          score: { home: f.goals.home || 0, away: f.goals.away || 0 }
        }));
    } catch { return []; }
  }

  // Superpose les infos live (minute + score réels) sur les matchs du calendrier.
  function applyLive(matches, live) {
    live.forEach(l => {
      const m = matches.find(x =>
        sameTeam(x.home, l.home) && sameTeam(x.away, l.away));
      if (m) {
        m.status = "LIVE";
        if (l.minute != null) m.minute = l.minute;
        m.score = l.score;
      }
    });
  }
  function sameTeam(teamObj, apiName) {
    const a = slug(teamObj.en), b = slug(apiName);
    return a === b || a.includes(b) || b.includes(a);
  }

  // ===========================================================
  //  EFFECTIFS (page Équipes) — via API-Football /players/squads
  // ===========================================================
  // Cache localStorage (pour économiser le quota 100 req/jour).
  function lsGet(k) {
    try { const o = JSON.parse(localStorage.getItem(k)); if (o && Date.now() < o.exp) return o.v; } catch {}
    return null;
  }
  function lsSet(k, v, ttl) {
    try { localStorage.setItem(k, JSON.stringify({ v, exp: Date.now() + ttl })); } catch {}
  }
  const afHeaders = () => ({ "x-apisports-key": APIFOOTBALL_KEY });

  // code FIFA -> nom anglais (pour retrouver l'équipe côté API-Football)
  const CODE_EN = {};
  Object.entries(TEAM).forEach(([en, arr]) => { CODE_EN[arr[1]] = en; });

  // Effectif d'EXEMPLE (sert quand il n'y a pas de clé, pour voir la page).
  const SAMPLE_SQUADS = {
    FRA: [
      { name: "Mike Maignan", number: 16, pos: "Goalkeeper" }, { name: "Brice Samba", number: 23, pos: "Goalkeeper" },
      { name: "Jules Koundé", number: 5, pos: "Defender" }, { name: "Dayot Upamecano", number: 4, pos: "Defender" },
      { name: "William Saliba", number: 17, pos: "Defender" }, { name: "Théo Hernández", number: 22, pos: "Defender" },
      { name: "Aurélien Tchouaméni", number: 8, pos: "Midfielder" }, { name: "Eduardo Camavinga", number: 6, pos: "Midfielder" },
      { name: "Adrien Rabiot", number: 14, pos: "Midfielder" }, { name: "Warren Zaïre-Emery", number: 18, pos: "Midfielder" },
      { name: "Kylian Mbappé", number: 10, pos: "Attacker" }, { name: "Ousmane Dembélé", number: 11, pos: "Attacker" },
      { name: "Marcus Thuram", number: 9, pos: "Attacker" }, { name: "Michael Olise", number: 7, pos: "Attacker" }
    ]
  };

  // Récupère (et met en cache 7 j) la table nom anglais -> id API-Football.
  async function afTeamIds() {
    const cached = lsGet("af_team_ids"); if (cached) return cached;
    const res = await fetch(`https://${APIFOOTBALL_HOST}/teams?league=${WORLDCUP_LEAGUE_ID}&season=${APIFOOTBALL_SEASON}`,
      { headers: afHeaders() });
    const j = await res.json();
    const map = {};
    (j.response || []).forEach(x => { map[slug(x.team.name)] = x.team.id; });
    if (Object.keys(map).length) lsSet("af_team_ids", map, 7 * DAY);
    return map;
  }

  function mapPlayers(list) {
    return (list || []).map(p => ({
      name: p.name, number: p.number, pos: p.position, photo: p.photo, age: p.age
    }));
  }

  const POS_WORD = { G: "Goalkeeper", D: "Defender", M: "Midfielder", A: "Attacker" };

  // Effectif d'une équipe. Priorité : Wikipédia (gratuit, hors-ligne) > API-Football > exemple.
  async function getSquad(team) {
    const en = team.en || CODE_EN[team.code] || team.name;

    // 1) Effectifs Wikipédia (fichier js/squads.js) — vrais 26 joueurs, sans clé.
    if (typeof SQUADS !== "undefined" && SQUADS[team.code] && SQUADS[team.code].length) {
      const players = SQUADS[team.code].map(([num, p, name]) =>
        ({ name, number: num || null, pos: POS_WORD[p] || "" }));
      return { players, source: "wiki" };
    }

    // 2) API-Football (si une clé est configurée) — avec photos.
    if (!APIFOOTBALL_KEY) {
      if (SAMPLE_SQUADS[team.code]) return { players: SAMPLE_SQUADS[team.code], sample: true };
      return { error: "NO_KEY" };
    }
    const ck = "af_squad_" + team.code;
    const cached = lsGet(ck); if (cached) return cached;
    try {
      const ids = await afTeamIds();
      let id = ids[slug(en)];
      if (!id) { // recherche de secours par nom
        const r = await fetch(`https://${APIFOOTBALL_HOST}/teams?search=${encodeURIComponent(en)}`, { headers: afHeaders() });
        const jj = await r.json(); id = (jj.response || [])[0]?.team?.id;
      }
      if (!id) return { error: "NO_TEAM" };
      const res = await fetch(`https://${APIFOOTBALL_HOST}/players/squads?team=${id}`, { headers: afHeaders() });
      const j = await res.json();
      const players = mapPlayers((j.response || [])[0]?.players);
      const out = { players };
      if (players.length) lsSet(ck, out, 2 * DAY);
      return out;
    } catch (e) {
      if (SAMPLE_SQUADS[team.code]) return { players: SAMPLE_SQUADS[team.code], sample: true };
      return { error: "FETCH" };
    }
  }

  // Liste des 48 équipes regroupées par poule (pour la page Équipes).
  function getTeams() {
    return Object.entries(GROUPS).map(([letter, teams]) => ({
      group: letter,
      teams: teams.map(t => ({
        name: t.name, code: t.code, flag: t.flag,
        en: CODE_EN[t.code] || t.name, group: letter
      }))
    }));
  }
  // Une équipe par son code FIFA.
  function getTeam(code) {
    for (const g of getTeams()) { const f = g.teams.find(t => t.code === code); if (f) return f; }
    return null;
  }

  // ===========================================================
  //  SOURCE 3 — DÉMO SIMULÉE (repli / hors-ligne)
  // ===========================================================
  const now = Date.now();
  function t(name, code, flag) { return { name, code, flag }; }
  const GROUPS = {
    A: [t("Mexique","MEX","🇲🇽"), t("Afrique du Sud","RSA","🇿🇦"), t("Corée du Sud","KOR","🇰🇷"), t("République tchèque","CZE","🇨🇿")],
    B: [t("Canada","CAN","🇨🇦"), t("Qatar","QAT","🇶🇦"), t("Suisse","SUI","🇨🇭"), t("Bosnie-Herzégovine","BIH","🇧🇦")],
    C: [t("Brésil","BRA","🇧🇷"), t("Maroc","MAR","🇲🇦"), t("Haïti","HAI","🇭🇹"), t("Écosse","SCO","🏴󠁧󠁢󠁳󠁣󠁴󠁿")],
    D: [t("États-Unis","USA","🇺🇸"), t("Paraguay","PAR","🇵🇾"), t("Australie","AUS","🇦🇺"), t("Turquie","TUR","🇹🇷")],
    E: [t("Allemagne","GER","🇩🇪"), t("Curaçao","CUW","🇨🇼"), t("Côte d'Ivoire","CIV","🇨🇮"), t("Équateur","ECU","🇪🇨")],
    F: [t("Pays-Bas","NED","🇳🇱"), t("Japon","JPN","🇯🇵"), t("Tunisie","TUN","🇹🇳"), t("Suède","SWE","🇸🇪")],
    G: [t("Belgique","BEL","🇧🇪"), t("Égypte","EGY","🇪🇬"), t("Iran","IRN","🇮🇷"), t("Nouvelle-Zélande","NZL","🇳🇿")],
    H: [t("Espagne","ESP","🇪🇸"), t("Cap-Vert","CPV","🇨🇻"), t("Arabie saoudite","KSA","🇸🇦"), t("Uruguay","URU","🇺🇾")],
    I: [t("France","FRA","🇫🇷"), t("Irak","IRQ","🇮🇶"), t("Sénégal","SEN","🇸🇳"), t("Norvège","NOR","🇳🇴")],
    J: [t("Argentine","ARG","🇦🇷"), t("Algérie","ALG","🇩🇿"), t("Autriche","AUT","🇦🇹"), t("Jordanie","JOR","🇯🇴")],
    K: [t("RD Congo","COD","🇨🇩"), t("Portugal","POR","🇵🇹"), t("Ouzbékistan","UZB","🇺🇿"), t("Colombie","COL","🇨🇴")],
    L: [t("Angleterre","ENG","🏴󠁧󠁢󠁥󠁮󠁧󠁿"), t("Croatie","CRO","🇭🇷"), t("Ghana","GHA","🇬🇭"), t("Panama","PAN","🇵🇦")]
  };
  const VENUES = [["Estadio Azteca","Mexico"],["MetLife Stadium","New York"],["SoFi Stadium","Los Angeles"],
    ["AT&T Stadium","Dallas"],["Mercedes-Benz Stadium","Atlanta"],["BC Place","Vancouver"],
    ["BMO Field","Toronto"],["Estadio Akron","Guadalajara"],["Lumen Field","Seattle"],
    ["Hard Rock Stadium","Miami"],["Levi's Stadium","San Francisco"],["NRG Stadium","Houston"]];
  const SCORERS = {
    MEX:["Santiago Giménez","Hirving Lozano"], RSA:["Lyle Foster","Percy Tau"],
    KOR:["Son Heung-min","Lee Kang-in"], CZE:["Patrik Schick","Adam Hložek"],
    BRA:["Vinícius Jr","Raphinha"], MAR:["Youssef En-Nesyri","Brahim Díaz"],
    FRA:["Kylian Mbappé","Ousmane Dembélé"], SEN:["Sadio Mané","Nicolas Jackson"]
  };
  function seeded(n){ let s=n*9301+49297; return ()=>{ s=(s*9301+49297)%233280; return s/233280; }; }
  function makeGoals(home, away, seed){
    const rnd=seeded(seed); const total=Math.floor(rnd()*5); const goals=[];
    for(let i=0;i<total;i++){ const side=rnd()<0.5?"home":"away"; const team=side==="home"?home:away;
      const names=SCORERS[team.code]||["Buteur"];
      goals.push({minute:3+Math.floor(rnd()*87),type:"goal",team:side,player:names[Math.floor(rnd()*names.length)]}); }
    return goals.sort((a,b)=>a.minute-b.minute);
  }
  function buildSeed(){
    const seed=[]; let idx=0;
    Object.keys(GROUPS).forEach(letter=>{
      const teams=GROUPS[letter];
      [[0,1],[2,3]].forEach(([h,a])=>{
        let kickoff;
        if(idx===0) kickoff=now-34*MIN;
        else if(idx===1) kickoff=now-27*HOUR;
        else if(idx===2) kickoff=now-23*HOUR;
        else if(idx===3) kickoff=now-3*HOUR;
        else kickoff=now+(idx-3)*150*MIN;
        const v=VENUES[idx%VENUES.length];
        let schedule;
        if(idx===0){ const nm=Math.max(2,Math.floor((now-kickoff)/MIN));
          const sH=SCORERS[teams[h].code]||["Buteur"], sA=SCORERS[teams[a].code]||["Buteur"];
          schedule=[{minute:12,team:"home",player:sH[0]},{minute:27,team:"away",player:sA[0]},
            {minute:nm+2,team:"home",player:sH[1]||sH[0]},{minute:71,team:"home",player:sH[0]},
            {minute:84,team:"away",player:sA[1]||sA[0]}];
        } else schedule = kickoff<=now ? makeGoals(teams[h],teams[a],idx+1) : [];
        seed.push({id:"m"+(idx+1),kickoff,stage:"Groupe "+letter,group:letter,
          venue:v[0],city:v[1],home:teams[h],away:teams[a],goalSchedule:schedule});
        idx++;
      });
    });
    return seed;
  }
  const SEED = buildSeed();
  function demoState(s){
    const elapsed=Date.now()-s.kickoff; let status,minute=null;
    if(elapsed<0) status="UPCOMING";
    else { const p=Math.floor(elapsed/MIN);
      if(p>=95){status="FINISHED";minute=90;}
      else {status="LIVE";minute=estMinute(elapsed);} }
    const limit=status==="UPCOMING"?-1:status==="FINISHED"?999:minute;
    const events=s.goalSchedule.filter(g=>g.minute<=limit).sort((a,b)=>a.minute-b.minute);
    const score={home:0,away:0}; events.forEach(e=>score[e.team]++);
    return {id:s.id,status,minute,date:s.kickoff,stage:s.stage,group:s.group,
      venue:s.venue,city:s.city,home:s.home,away:s.away,score,events};
  }
  function demoAll(){ return SEED.map(demoState); }

  // ===========================================================
  //  API PUBLIQUE
  // ===========================================================
  async function realAll() {
    const matches = await fetchCalendar();
    const live = await fetchLive();
    if (live.length) applyLive(matches, live);
    return matches;
  }

  // Couleur de marque par groupe (palette multicolore de l'identité CDM 2026).
  const GROUP_COLORS = {
    A:"#6a3fb5", B:"#1f54b5", C:"#3fa64a", D:"#e23b30", E:"#2fa39b", F:"#8fbf3f",
    G:"#e8631c", H:"#e0457a", I:"#2730a0", J:"#d9b53a", K:"#e58a6a", L:"#9b7fd4"
  };
  function groupColor(letter) { return GROUP_COLORS[(letter || "").trim()] || "#ff3d7f"; }

  return {
    SOURCE,
    flagImg,
    groupColor,
    getTeams,
    getTeam,
    getSquad,
    hasApiKey: () => !!APIFOOTBALL_KEY,
    async getMatches() {
      if (SOURCE === "demo") return demoAll();
      try { return await realAll(); }
      catch (e) {
        console.warn("Calendrier indisponible, repli démo :", e.message);
        if (USE_DEMO_FALLBACK) return demoAll();
        return [];
      }
    },
    async getMatch(id) {
      if (SOURCE === "demo") return demoAll().find(m => m.id === id) || null;
      try {
        const all = await realAll();
        return all.find(m => m.id === id) || null;
      } catch {
        if (USE_DEMO_FALLBACK) return demoAll().find(m => m.id === id) || null;
        return null;
      }
    }
  };
})();
