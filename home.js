/* home.js — Page d'accueil : bandeau du match en direct + liste des matchs */

let currentFilter = "all";

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(ts) {
  const d = new Date(ts), today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today.getTime() + 86400000);
  if (sameDay) return "Aujourd'hui";
  if (d.toDateString() === tomorrow.toDateString()) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function statusBadge(m) {
  if (m.status === "LIVE") return `<span class="badge live">🔴 ${m.minute}'</span>`;
  if (m.status === "FINISHED") return `<span class="badge finished">Terminé</span>`;
  return `<span class="badge upcoming">${fmtDay(m.date)} · ${fmtTime(m.date)}</span>`;
}

function scoreOrTime(m) {
  if (m.status === "UPCOMING") return `<div class="vs">vs</div>`;
  return `<div class="score">${m.score.home} <span>–</span> ${m.score.away}</div>`;
}

function teamHtml(team, side) {
  return `<div class="team ${side}">
    ${DataAPI.flagImg(team, "flag")}
    <span class="team-name">${team.name}</span>
  </div>`;
}

function renderHero(matches) {
  const hero = document.getElementById("hero");
  // priorité : un match LIVE, sinon le prochain UPCOMING
  const live = matches.filter(m => m.status === "LIVE").sort((a, b) => b.minute - a.minute);
  const upcoming = matches.filter(m => m.status === "UPCOMING").sort((a, b) => a.date - b.date);
  const feature = live[0] || upcoming[0];

  if (!feature) { hero.innerHTML = `<div class="hero-empty">Aucun match à afficher.</div>`; return; }

  const isLive = feature.status === "LIVE";
  hero.innerHTML = `
    <div class="hero-card ${isLive ? "is-live" : ""}" data-id="${feature.id}">
      <div class="hero-top">
        ${isLive
          ? `<span class="hero-tag live">🔴 EN DIRECT · ${feature.minute}'</span>`
          : `<span class="hero-tag">⏱️ Prochain match · ${fmtDay(feature.date)} ${fmtTime(feature.date)}</span>`}
        <span class="hero-stage">${[feature.stage, feature.venue || feature.city].filter(Boolean).join(" · ")}</span>
      </div>
      <div class="hero-match">
        <div class="hero-team">
          ${DataAPI.flagImg(feature.home, "hero-flag")}
          <span class="hero-tname">${feature.home.name}</span>
        </div>
        <div class="hero-center">
          ${feature.status === "UPCOMING"
            ? `<div class="hero-time">${fmtTime(feature.date)}</div>`
            : `<div class="hero-score">${feature.score.home} – ${feature.score.away}</div>`}
        </div>
        <div class="hero-team">
          ${DataAPI.flagImg(feature.away, "hero-flag")}
          <span class="hero-tname">${feature.away.name}</span>
        </div>
      </div>
      <button class="hero-btn">${isLive ? "▶ Voir le direct" : "Voir le match"}</button>
    </div>`;

  hero.querySelector(".hero-card").addEventListener("click", () => {
    location.href = `match.html?id=${feature.id}`;
  });
}

function renderList(matches) {
  const list = document.getElementById("match-list");
  const order = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
  let arr = [...matches].sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.date - b.date;
  });
  if (currentFilter !== "all") arr = arr.filter(m => m.status === currentFilter);

  if (!arr.length) { list.innerHTML = `<div class="loading">Aucun match dans cette catégorie.</div>`; return; }

  list.innerHTML = arr.map(m => {
    const gc = DataAPI.groupColor(m.group);
    return `
    <a class="match-card ${m.status === "LIVE" ? "live" : ""}" href="match.html?id=${m.id}" style="border-left:5px solid ${gc}">
      <div class="mc-head">
        ${statusBadge(m)}
        <span class="mc-stage" style="color:${gc}">${m.stage}</span>
      </div>
      <div class="mc-body">
        ${teamHtml(m.home, "home")}
        ${scoreOrTime(m)}
        ${teamHtml(m.away, "away")}
      </div>
      <div class="mc-foot">${[m.venue, m.city].filter(Boolean).join(" · ")}</div>
    </a>`;
  }).join("");
}

async function refresh() {
  const matches = await DataAPI.getMatches();
  renderHero(matches);
  renderList(matches);
}

document.getElementById("filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.filter;
  refresh();
});

refresh();
setInterval(refresh, 10000); // rafraîchit toutes les 10 s
