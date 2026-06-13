/* match.js — Page d'un match : direct, fil du match, alerte "BUT" + son */

function getId() {
  return new URLSearchParams(location.search).get("id");
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const id = getId();
let prevScore = null;   // score au rafraîchissement précédent (détection de but)

// Diffuseurs officiels (légaux) où regarder le direct. Modifie cette liste
// selon ton pays / tes abonnements — l'app ne fait que créer des liens.
const BROADCASTERS = [
  { name: "FIFA+", url: "https://www.plus.fifa.com", note: "officiel" },
  { name: "TF1 en direct", url: "https://www.tf1.fr/direct", note: "gratuit (France)" },
  { name: "M6 en direct", url: "https://www.6play.fr/m6/direct", note: "gratuit (France)" }
];

// Bloc "Regarder en direct" affiché uniquement quand le match est EN DIRECT.
function watchBlock(m) {
  if (m.status !== "LIVE") return "";
  const btns = BROADCASTERS.map(b =>
    `<a class="watch-btn" href="${b.url}" target="_blank" rel="noopener">
       ▶ ${b.name}${b.note ? `<span class="watch-note">${b.note}</span>` : ""}
     </a>`).join("");
  return `<div class="watch-live">
    <div class="watch-title">📺 Regarder le direct</div>
    <div class="watch-btns">${btns}</div>
    <div class="watch-hint">La vidéo est diffusée par les détenteurs de droits TV — voici les diffuseurs officiels.</div>
  </div>`;
}

// --- Bouton son ---
const soundBtn = document.getElementById("sound-toggle");
soundBtn.addEventListener("click", () => {
  Crowd.enable();
  soundBtn.textContent = "🔊 Son activé";
  soundBtn.classList.add("on");
  setTimeout(() => Crowd.cheer(), 100); // petit test
});

// --- Alerte visuelle "BUT" ---
function showGoalAlert(text) {
  const alert = document.getElementById("goal-alert");
  document.getElementById("goal-detail").textContent = text;
  alert.classList.add("show");
  Crowd.cheer();
  setTimeout(() => alert.classList.remove("show"), 4000);
}

// Annonce un but : récupère le buteur le plus récent de l'équipe concernée.
function announceGoal(m, side) {
  const team = side === "home" ? m.home : m.away;
  const goals = m.events.filter(e => e.type === "goal" && e.team === side);
  const last = goals[goals.length - 1];
  const who = last && last.player ? `${last.player} (${team.name})` : `But pour ${team.name} !`;
  const min = last && last.minute ? ` · ${last.minute}'` : (m.minute ? ` · ${m.minute}'` : "");
  showGoalAlert(who + min);
}

function statusLabel(m) {
  if (m.status === "LIVE") return `🔴 EN DIRECT · ${m.minute}'`;
  if (m.status === "FINISHED") return "Terminé";
  return `Coup d'envoi à ${fmtTime(m.date)}`;
}

function renderDetail(m) {
  document.getElementById("match-detail").innerHTML = `
    <div class="md-status ${m.status === "LIVE" ? "live" : ""}">${statusLabel(m)}</div>
    <div class="md-meta">${[m.stage, m.venue, m.city].filter(Boolean).join(" · ")}</div>
    <div class="md-score">
      <div class="md-team">
        ${DataAPI.flagImg(m.home, "md-flag")}
        <span class="md-name">${m.home.name}</span>
      </div>
      <div class="md-numbers">
        ${m.status === "UPCOMING"
          ? `<span class="md-vs">${fmtTime(m.date)}</span>`
          : `<span class="md-goals">${m.score.home}</span>
             <span class="md-sep">–</span>
             <span class="md-goals">${m.score.away}</span>`}
      </div>
      <div class="md-team">
        ${DataAPI.flagImg(m.away, "md-flag")}
        <span class="md-name">${m.away.name}</span>
      </div>
    </div>
    ${watchBlock(m)}`;
}

function renderTimeline(m) {
  const tl = document.getElementById("timeline");
  if (m.status === "UPCOMING") {
    tl.innerHTML = `<li class="tl-empty">Le match n'a pas encore commencé.</li>`;
    return;
  }
  if (!m.events.length) {
    tl.innerHTML = `<li class="tl-empty">Aucun but pour l'instant…</li>`;
    return;
  }
  tl.innerHTML = [...m.events].reverse().map(e => {
    const team = e.team === "home" ? m.home : m.away;
    const sideClass = e.team === "home" ? "left" : "right";
    return `<li class="tl-item ${sideClass}">
      <span class="tl-min">${e.minute}'</span>
      <span class="tl-icon">⚽</span>
      ${DataAPI.flagImg(team, "tl-flag")}
      <span class="tl-text"><strong>${e.player}</strong> — ${team.name}</span>
    </li>`;
  }).join("");
}

function pageTitle(m) {
  document.title = `${m.home.code} ${m.score.home}-${m.score.away} ${m.away.code} · CDM 2026`;
}

async function refresh() {
  const m = await DataAPI.getMatch(id);
  if (!m) {
    document.getElementById("match-detail").innerHTML =
      `<div class="loading">Match introuvable. <a href="index.html">Retour</a></div>`;
    return;
  }

  // Détecte un but = le score a augmenté depuis le dernier rafraîchissement.
  // (Marche pour toutes les sources : démo, openfootball, API-Football.)
  if (prevScore && m.status === "LIVE") {
    if (m.score.home > prevScore.home) announceGoal(m, "home");
    if (m.score.away > prevScore.away) announceGoal(m, "away");
  }
  prevScore = { home: m.score.home, away: m.score.away };

  renderDetail(m);
  renderTimeline(m);
  pageTitle(m);
}

if (!id) {
  document.getElementById("match-detail").innerHTML =
    `<div class="loading">Aucun match sélectionné. <a href="index.html">Retour à l'accueil</a></div>`;
} else {
  refresh();
  setInterval(refresh, 5000); // un match en direct se rafraîchit toutes les 5 s
}
