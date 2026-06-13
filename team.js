/* team.js — Composition d'une équipe sur le terrain (style maquette) */

const code = new URLSearchParams(location.search).get("code");

// Icône joueur générique (quand pas de photo) — comme la maquette.
const PERSON_ICON = `data:image/svg+xml;utf8,` + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
   <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4z"/></svg>`);

// Coordonnées (en % du terrain) d'une formation 4-3-3. Le gardien est en bas.
const FORMATION = {
  GK:  [{ x: 50, y: 91 }],
  DEF: [{ x: 16, y: 73 }, { x: 38, y: 77 }, { x: 62, y: 77 }, { x: 84, y: 73 }],
  MID: [{ x: 27, y: 51 }, { x: 50, y: 49 }, { x: 73, y: 51 }],
  FWD: [{ x: 21, y: 23 }, { x: 50, y: 17 }, { x: 79, y: 23 }]
};
const POS_GROUP = { Goalkeeper: "GK", Defender: "DEF", Midfielder: "MID", Attacker: "FWD" };

// Le contenu d'un joueur (avatar + numéro + nom).
function chipInner(p) {
  const photo = p.photo
    ? `<img class="player-photo" src="${p.photo}" alt="${p.name}" loading="lazy"
         onerror="this.onerror=null;this.src='${PERSON_ICON}';this.classList.add('is-icon')">`
    : `<img class="player-photo is-icon" src="${PERSON_ICON}" alt="">`;
  const num = p.number != null ? `<span class="player-num">${p.number}</span>` : "";
  return `<div class="player-avatar">${photo}${num}</div><div class="player-name">${p.name}</div>`;
}

// Choisit un 11 de départ (4-3-3) ; le reste part sur le banc.
function pickStarters(players) {
  const groups = { GK: [], DEF: [], MID: [], FWD: [], OTHER: [] };
  players.forEach(p => groups[POS_GROUP[p.pos] || "OTHER"].push(p));
  const used = new Set();
  const starters = [];
  ["GK", "DEF", "MID", "FWD"].forEach(key => {
    FORMATION[key].forEach((coord, i) => {
      let p = groups[key][i];
      if (!p) p = groups.OTHER.find(x => !used.has(x)) || players.find(x => !used.has(x));
      if (p) { used.add(p); starters.push({ player: p, coord }); }
    });
  });
  const bench = players.filter(p => !used.has(p));
  return { starters, bench };
}

function renderPitch(players) {
  const { starters, bench } = pickStarters(players);
  const onPitch = starters.map(s =>
    `<div class="player on-pitch" style="left:${s.coord.x}%;top:${s.coord.y}%">${chipInner(s.player)}</div>`
  ).join("");

  const benchHtml = bench.length
    ? `<h2 class="section-title">Remplaçants (${bench.length})</h2>
       <div class="bench">${bench.map(p => `<div class="player">${chipInner(p)}</div>`).join("")}</div>`
    : "";

  return `<div class="pitch formation">${onPitch}</div>${benchHtml}`;
}

async function load() {
  const team = code ? DataAPI.getTeam(code) : null;
  const head = document.getElementById("team-head");
  if (!team) {
    head.innerHTML = `<div class="loading">Équipe introuvable. <a href="teams.html">Retour</a></div>`;
    return;
  }
  const gc = DataAPI.groupColor(team.group);
  head.style.borderLeft = `6px solid ${gc}`;
  head.innerHTML = `
    ${DataAPI.flagImg(team, "team-head-flag")}
    <div>
      <h1 class="team-head-name">${team.name}</h1>
      <div class="team-head-sub" style="color:${gc}">Groupe ${team.group}</div>
    </div>`;
  document.getElementById("pitch-wrap").innerHTML = `<div class="loading">Chargement de l'effectif…</div>`;

  const res = await DataAPI.getSquad(team);

  const notice = document.getElementById("notice");
  if (res.error === "NO_KEY") {
    document.getElementById("pitch-wrap").innerHTML = "";
    notice.innerHTML = `<div class="key-card">
      <strong>Effectif indisponible</strong><br>
      Ajoute ta clé gratuite API-Football dans <code>js/data.js</code>
      (champ <code>APIFOOTBALL_KEY</code>) pour afficher les joueurs.
      Crée un compte gratuit sur
      <a href="https://dashboard.api-football.com" target="_blank" rel="noopener">dashboard.api-football.com</a>.
    </div>`;
    return;
  }
  if (res.error) {
    document.getElementById("pitch-wrap").innerHTML =
      `<div class="loading">Impossible de charger l'effectif (${res.error}).</div>`;
    return;
  }

  if (res.sample) {
    notice.innerHTML = `<div class="sample-banner">⚠️ Effectif d'<strong>exemple</strong>.
      Ajoute ta clé API-Football dans <code>js/data.js</code> pour les vrais effectifs.</div>`;
  }
  document.getElementById("pitch-wrap").innerHTML = renderPitch(res.players);
  const srcLabel = res.sample ? " (exemple)"
    : res.source === "wiki" ? " · source : Wikipédia"
    : " · source : API-Football";
  document.getElementById("foot-note").textContent = `${res.players.length} joueurs${srcLabel}`;
}

load();
