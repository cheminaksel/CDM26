/* teams.js — Liste des 48 équipes regroupées par poule */

function render() {
  const groups = DataAPI.getTeams();
  const el = document.getElementById("teams");
  el.innerHTML = groups.map(g => {
    const c = DataAPI.groupColor(g.group);
    return `
    <div class="team-group">
      <h2 class="group-title" style="color:${c};border-color:${c}">Groupe ${g.group}</h2>
      <div class="team-grid">
        ${g.teams.map(t => `
          <a class="team-tile" href="team.html?code=${t.code}" style="border-left:5px solid ${c}">
            ${DataAPI.flagImg(t, "team-tile-flag")}
            <span class="team-tile-name">${t.name}</span>
          </a>`).join("")}
      </div>
    </div>`;
  }).join("");
}

render();
