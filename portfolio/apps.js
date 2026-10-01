'use strict';
/* ==================================================================
   PORTFOLIO macOS — apps.js
   Les applications : Finder, DaVinci Resolve, After Effects, Photoshop,
   Canva, Mail, Contacts, Notes (storyboards) et Keynote (présentation).
   ================================================================== */

/* ==================================================================
   FINDER (projets)
   ================================================================== */
const FOLDERS = {
  all:      { label: 'Tous les projets', icon: 'clock', f: () => true },
  pro:      { label: 'Projets pro', icon: 'briefcase', f: p => p.category === 'pro' },
  scolaire: { label: 'Projets scolaires', icon: 'cap', f: p => p.category === 'scolaire' },
  fav:      { label: 'Coups de cœur', icon: 'heart', f: p => p.fav },
  video:    { label: 'Vidéos', icon: 'film', f: p => p.type === 'video' },
  motion:   { label: 'Motion design', icon: 'sparkle', f: p => p.type === 'motion' },
  photo:    { label: 'Photos', icon: 'camera', f: p => p.type === 'photo' },
  design:   { label: 'Graphisme', icon: 'palette', f: p => p.type === 'design' }
};
const SIDEBAR = [['Favoris', ['all', 'pro', 'scolaire', 'fav']], ['Médias', ['video', 'motion', 'photo', 'design']]];
const KIND = { video: 'Vidéo QuickTime', motion: 'Projet After Effects', photo: 'Image JPEG', design: 'Image PNG' };
const kindOf = p => extFor(p) === 'psd' ? 'Document Photoshop' : KIND[p.type];
let finderSeq = 0;

function openFolder(view = 'all', from, forceNew) {
  if (!forceNew) {
    const ex = [...WM.list.values()].find(r => r.kind === 'folder');
    if (ex) { if (ex.minimized) WM.restore(ex.id); else WM.focus(ex.id); finderGo(ex, view); return; }
  }
  WM.open('finder-' + (++finderSeq), {
    app: 'finder', kind: 'folder', title: FOLDERS[view].label, w: 940, h: 580, from, chrome: 'none', cls: 'win-finder', minW: 520,
    build: (body, rec) => { rec.state = { view, mode: isMobile() ? 'grid' : 'grid', q: '', hist: [view], hi: 0, sel: null }; renderFinder(body, rec); }
  });
}
const itemGrid = (p, i) => `<div class="fd-item" data-id="${p.id}" tabindex="0" style="animation-delay:${Math.min(i, 12) * 25}ms">
  <div class="fd-th">${poster(p)}${p.type === 'video' || p.type === 'motion' ? `<span class="fd-dur mono">${esc(p.duration)}</span>` : ''}${p.fav ? `<span class="fd-fav">${G.heart}</span>` : ''}</div>
  <div class="fd-name"><i class="fd-tagdot ${p.category}"></i>${esc(fileName(p))}</div></div>`;
const itemRow = p => `<div class="fd-item fd-row" data-id="${p.id}" tabindex="0">
  <span class="fr-name"><span class="fr-th">${poster(p, { label: false })}</span><span class="fr-n">${esc(fileName(p))}</span></span><span>${esc(p.year)}</span><span class="mono">${esc(p.duration)}</span><span>${esc(kindOf(p))}</span></div>`;

function renderFinder(body, rec) {
  body.innerHTML = `<div class="fd">
    <aside class="fd-side">
      <div class="fd-side-top" data-drag><div class="tl-slot"></div></div>
      <nav class="fd-side-scroll">
        ${SIDEBAR.map(([hd, ks]) => `<div class="fd-h">${hd}</div>${ks.map(k => `<button class="fd-link" data-v="${k}"><span class="fd-i">${G[FOLDERS[k].icon]}</span><span class="fd-l">${FOLDERS[k].label}</span></button>`).join('')}`).join('')}
        <div class="fd-h">Applications</div>
        ${['keynote', 'resolve', 'ae', 'lr', 'ps', 'canva'].map(a => `<button class="fd-link" data-app="${a}"><span class="fd-i app">${icon(APPS[a].icon)}</span><span class="fd-l">${a === 'keynote' ? 'Présentation' : APPS[a].name}</span></button>`).join('')}
        <div class="fd-h">Tags</div>
        <button class="fd-link" data-v="pro"><i class="fd-tag" style="background:#ff9f0a"></i><span class="fd-l">Pro</span></button>
        <button class="fd-link" data-v="scolaire"><i class="fd-tag" style="background:#0a84ff"></i><span class="fd-l">Scolaire</span></button>
        <button class="fd-link" data-v="fav"><i class="fd-tag" style="background:#ff453a"></i><span class="fd-l">Favoris</span></button>
      </nav>
    </aside>
    <div class="fd-main">
      <header class="fd-bar" data-drag>
        <div class="tl-slot fd-mtl"></div>
        <div class="fd-nav"><button data-nav="-1" aria-label="Précédent">${G.back}</button><button data-nav="1" aria-label="Suivant">${G.fwd}</button></div>
        <div class="fd-title"></div>
        <div class="fd-tools">
          <div class="fd-seg"><button data-mode="grid" aria-label="Présentation en icônes">${G.grid}</button><button data-mode="list" aria-label="Présentation en liste">${G.list}</button><button data-mode="gallery" aria-label="Présentation en galerie">${G.gallery}</button></div>
          <button class="fd-tb" data-a="share" aria-label="Partager">${G.share}</button>
          <button class="fd-tb" data-a="tag" aria-label="Tags">${G.tag}</button>
          <label class="fd-search">${G.search}<input type="search" placeholder="Rechercher" aria-label="Rechercher un projet"></label>
        </div>
      </header>
      <div class="fd-chips">${Object.keys(FOLDERS).map(k => `<button data-v="${k}">${FOLDERS[k].label}</button>`).join('')}</div>
      <div class="fd-content" tabindex="-1"></div>
      <footer class="fd-path"><span class="fd-crumbs"></span><span class="fd-count"></span></footer>
    </div></div>`;
  const openItem = it => { const p = byId(it.dataset.id); openProject(p, ($('.fd-th, .fr-th, .fg-prev', it) || it).getBoundingClientRect()); };
  const select = it => { $$('.fd-item.sel', body).forEach(x => x.classList.remove('sel')); if (it) { it.classList.add('sel'); rec.state.sel = it.dataset.id; } };
  body.addEventListener('click', e => {
    const app = e.target.closest('[data-app]'); if (app) { launch(app.dataset.app, app.getBoundingClientRect()); return; }
    const v = e.target.closest('[data-v]'); if (v) { finderGo(rec, v.dataset.v); return; }
    const n = e.target.closest('[data-nav]');
    if (n) { const hi = rec.state.hi + Number(n.dataset.nav); if (hi >= 0 && hi < rec.state.hist.length) { rec.state.hi = hi; rec.state.view = rec.state.hist[hi]; updateFinder(rec); } return; }
    const m = e.target.closest('[data-mode]'); if (m) { rec.state.mode = m.dataset.mode; updateFinder(rec); return; }
    const a = e.target.closest('[data-a]');
    if (a) {
      if (a.dataset.a === 'share') copyEmail();
      if (a.dataset.a === 'open' || a.dataset.a === 'ql') { const p = byId(rec.state.sel); if (p) (a.dataset.a === 'open' ? openProject : quickLook)(p, a.getBoundingClientRect()); }
      return;
    }
    const g = e.target.closest('.fg-th'); if (g) { rec.state.sel = g.dataset.id; updateFinder(rec); return; }
    const it = e.target.closest('.fd-item:not(.fd-head)');
    if (it) { select(it); if (isTouch()) openItem(it); }
    else if (e.target.closest('.fd-content')) select(null);
  });
  body.addEventListener('dblclick', e => { const it = e.target.closest('.fd-item:not(.fd-head)'); if (it && !isTouch()) openItem(it); });
  body.addEventListener('keydown', e => {
    if (e.target.matches('input')) return;
    const it = e.target.closest('.fd-item:not(.fd-head)');
    if (e.key === 'Enter' && it) openItem(it);
    if (e.key === ' ' && (it || rec.state.sel)) { e.preventDefault(); const p = byId(it ? it.dataset.id : rec.state.sel); if (p) quickLook(p); }
  });
  body.addEventListener('contextmenu', e => {
    const it = e.target.closest('.fd-item:not(.fd-head)'); if (!it) return;
    e.preventDefault(); e.stopPropagation(); select(it);
    const p = byId(it.dataset.id), app = APPS[appFor(p)];
    showMenu([
      { label: 'Ouvrir', action: () => openItem(it) },
      { label: `Ouvrir avec ${app.name}`, action: () => openProject(p) },
      '-',
      { label: `Coup d'œil sur « ${fileName(p)} »`, kbd: 'Espace', action: () => quickLook(p) },
      { label: 'Lire les informations', action: () => { rec.state.mode = 'gallery'; updateFinder(rec); } }
    ], e.clientX, e.clientY);
  });
  $('.fd-search input', body).addEventListener('input', e => { rec.state.q = e.target.value; updateFinder(rec); });
  updateFinder(rec);
}
function finderGo(rec, v) {
  if (!FOLDERS[v] || v === rec.state.view) return;
  rec.state.hist = rec.state.hist.slice(0, rec.state.hi + 1); rec.state.hist.push(v); rec.state.hi = rec.state.hist.length - 1;
  rec.state.view = v; updateFinder(rec);
}
function updateFinder(rec) {
  const { view, mode, q } = rec.state, body = rec.body, F = FOLDERS[view];
  const items = CONFIG.projects.filter(F.f).filter(p => !q || norm(`${p.title} ${p.client} ${(p.tags || []).join(' ')}`).includes(norm(q)));
  rec.setTitle(F.label);
  $$('.fd-link[data-v], .fd-chips button', body).forEach(b => b.classList.toggle('active', b.dataset.v === view && !b.querySelector('.fd-tag')));
  $$('[data-mode]', body).forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $('[data-nav="-1"]', body).disabled = rec.state.hi <= 0;
  $('[data-nav="1"]', body).disabled = rec.state.hi >= rec.state.hist.length - 1;
  $('.fd-title', body).textContent = F.label;
  const c = $('.fd-content', body); c.className = 'fd-content ' + mode;
  if (!items.length) c.innerHTML = `<div class="fd-empty">${G.search}<p>Aucun projet ne correspond${q ? ` à « ${esc(q)} »` : ''}</p></div>`;
  else if (mode === 'grid') c.innerHTML = items.map(itemGrid).join('');
  else if (mode === 'list') c.innerHTML = '<div class="fd-item fd-row fd-head"><span>Nom</span><span>Année</span><span>Durée / taille</span><span>Type</span></div>' + items.map(itemRow).join('');
  else {
    const p = items.find(x => x.id === rec.state.sel) || items[0]; rec.state.sel = p.id;
    const app = APPS[appFor(p)];
    c.innerHTML = `<div class="fg">
      <div class="fg-stage"><div class="fd-item fg-one" data-id="${p.id}"><div class="fg-prev">${poster(p)}</div></div>
        <aside class="fg-info"><div class="fg-head"><span class="fg-ico">${icon(app.icon)}</span><div><b>${esc(fileName(p))}</b><small>${esc(kindOf(p))} · ${esc(p.duration)}</small></div></div>
          <div class="fg-h">Informations</div>
          <dl class="fg-dl"><div><dt>Titre</dt><dd>${esc(p.title)}</dd></div><div><dt>Client</dt><dd>${esc(p.client)}</dd></div><div><dt>Année</dt><dd>${esc(p.year)}</dd></div><div><dt>Rôle</dt><dd>${esc(p.role)}</dd></div><div><dt>Catégorie</dt><dd>${esc(CAT[p.category])}</dd></div><div><dt>Logiciels</dt><dd>${(p.tools || []).map(esc).join(', ')}</dd></div></dl>
          <p class="fg-desc">${esc(p.description)}</p>
          <div class="fg-tags">${(p.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
          <div class="fg-act"><button class="btn primary" data-a="open"><span class="btn-ico">${icon(app.icon)}</span>Ouvrir avec ${esc(app.name)}</button><button class="btn" data-a="ql">${G.eye}Coup d'œil</button></div>
        </aside></div>
      <div class="fg-strip">${items.map(x => `<button class="fg-th ${x.id === p.id ? 'on' : ''}" data-id="${x.id}" aria-label="${esc(x.title)}">${poster(x, { label: false })}</button>`).join('')}</div></div>`;
  }
  if (rec.state.sel && mode !== 'gallery') { const s = $(`.fd-item[data-id="${rec.state.sel}"]`, c); if (s) s.classList.add('sel'); }
  $('.fd-crumbs', body).innerHTML = ['Macintosh HD', 'Utilisateurs', slug(firstName()) || 'moi', 'Projets', F.label].map(esc).join(' <i>›</i> ');
  $('.fd-count', body).textContent = `${items.length} élément${items.length > 1 ? 's' : ''}`;
}

/* ==================================================================
   COUP D'ŒIL (Quick Look)
   ================================================================== */
function quickLook(p, from) {
  if (!p) return;
  const app = APPS[appFor(p)];
  WM.open('ql-' + p.id, {
    app: 'finder', kind: 'ql', title: fileName(p), w: 900, h: 560, cls: 'win-dark win-ql', from,
    build: (body, rec) => {
      const imgs = asList(p.gallery).length ? asList(p.gallery) : [];
      let media;
      if (isVideoFile(p.video)) media = `<video src="${esc(p.video)}" controls playsinline autoplay preload="metadata"></video>`;
      else if (embedURL(p.video)) media = iframeHTML(p.video, true);
      else if (imgs.length) media = `<img src="${esc(imgs[0])}" alt="${esc(p.title)}">`;
      else media = poster(p);
      body.innerHTML = `<div class="ql"><div class="ql-media">${media}</div>
        <div class="ql-bar"><span>${esc(p.title)} · ${esc(p.year)}</span><button class="btn sm primary" data-a="open">Ouvrir avec ${esc(app.name)}</button></div></div>`;
      $('[data-a="open"]', body).addEventListener('click', e => { WM.close(rec.id); openProject(p, e.currentTarget.getBoundingClientRect()); });
      rec.onclose = () => { const v = $('video', body); if (v) v.pause(); };
      rec.onhide = rec.onclose;
    }
  });
}

/* ==================================================================
   OUVERTURE D'UN PROJET DANS SON LOGICIEL
   ================================================================== */
async function openProject(p, from) {
  if (!p) return;
  const app = appFor(p);
  await ensureLaunched(app);
  ({ resolve: openResolve, ae: openAE, lr: openLR, ps: openPS, canva: openCanva }[app] || quickLook)(p, from);
}
function openShowreel(from) { openProject(REEL, from); }

/* ==================================================================
   LECTURE SYNCHRONISÉE : vidéo du Viewer + capture de la timeline
   ================================================================== */
function viewerMediaHTML(p) {
  if (isVideoFile(p.video)) return `<video class="vx" src="${esc(p.video)}" playsinline preload="metadata"></video>`;
  if (embedURL(p.video)) return `<div class="vx vx-embed">${iframeHTML(p.video, false)}</div>`;
  return `<div class="vx vx-fake">${poster(p)}</div>`;
}
function captureHTML(p, cls = '') {
  if (!p.timeline) return '';
  const vid = isVideoFile(p.timeline);
  const ph = vid ? p.timelinePlayhead === true : p.timelinePlayhead !== false;
  return `<div class="cap ${cls}"><div class="cap-in">${vid ? `<video class="cap-v" src="${esc(p.timeline)}" muted playsinline preload="auto"></video>` : `<img class="cap-i" src="${esc(p.timeline)}" alt="Timeline du projet ${esc(p.title)}">`}${ph ? '<i class="cap-ph"></i>' : ''}</div></div>`;
}
/* Transport commun : pilote la vidéo (ou une lecture simulée) et la capture.
   cb.onTick(t, durée) est appelé à chaque image pendant la lecture. */
function createTransport(root, p, cb = {}) {
  let v = $('video.vx', root);
  const cv = $('video.cap-v', root), external = !!$('.vx-embed', root);
  const fallback = durSec(p.duration) || 30;
  const T = { t: 0, playing: false, raf: 0, last: 0, external };
  T.dur = () => (v && isFinite(v.duration) && v.duration > 0) ? v.duration : fallback;
  const emit = () => { if (cb.onTick) cb.onTick(T.t, T.dur()); };
  const capRate = () => { if (cv && isFinite(cv.duration) && cv.duration > 0) cv.playbackRate = clamp(cv.duration / T.dur(), 0.25, 4); };
  const syncCap = force => {
    if (!cv || !isFinite(cv.duration) || !cv.duration) return;
    const want = Math.min(T.t / T.dur() * cv.duration, cv.duration - 0.05);
    if (force || Math.abs(cv.currentTime - want) > 0.35) cv.currentTime = want;
  };
  const tick = now => {
    if (v) T.t = v.currentTime;
    else { T.t += (now - T.last) / 1000; T.last = now; if (T.t >= T.dur()) T.t = 0; }
    syncCap(false); emit();
    if (T.playing) T.raf = requestAnimationFrame(tick);
  };
  T.play = () => {
    if (external || T.playing) return;
    T.playing = true;
    if (v) { if (v.ended || v.currentTime >= T.dur() - 0.05) v.currentTime = 0; const pr = v.play(); if (pr) pr.catch(() => T.pause()); }
    if (cv) { capRate(); syncCap(true); cv.play().catch(() => {}); }
    T.last = performance.now(); cancelAnimationFrame(T.raf); T.raf = requestAnimationFrame(tick);
    if (cb.onState) cb.onState(true);
  };
  T.pause = () => {
    T.playing = false; cancelAnimationFrame(T.raf);
    if (v && !v.paused) v.pause(); if (cv && !cv.paused) cv.pause();
    if (cb.onState) cb.onState(false); emit();
  };
  T.toggle = () => (T.playing ? T.pause() : T.play());
  T.seek = t => { T.t = clamp(t, 0, Math.max(0, T.dur() - 0.04)); if (v) v.currentTime = T.t; syncCap(true); emit(); };
  T.step = d => T.seek(T.t + d);
  T.destroy = () => { T.pause(); [v, cv].forEach(m => { if (m) { m.removeAttribute('src'); m.load(); } }); };
  if (v) {
    v.addEventListener('loadedmetadata', () => { capRate(); emit(); });
    v.addEventListener('ended', () => { if (cb.loop) { T.seek(0); T.playing = false; T.play(); } else T.pause(); });
    v.addEventListener('error', () => { // fichier introuvable : on repasse sur l'aperçu généré
      const fake = h(`<div class="vx vx-fake">${poster(p)}</div>`); v.replaceWith(fake); v = null; T.pause();
    });
  }
  if (cv) cv.addEventListener('loadedmetadata', () => { capRate(); syncCap(true); });
  // tête de lecture sur une capture image + clic pour se déplacer
  const cap = $('.cap', root);
  if (cap) {
    const ph = $('.cap-ph', cap), [r0, r1] = Array.isArray(p.timelineRange) ? p.timelineRange : [0, 1];
    const prev = cb.onTick;
    cb.onTick = (t, d) => { if (ph) ph.style.left = ((r0 + (t / d) * (r1 - r0)) * 100).toFixed(3) + '%'; if (prev) prev(t, d); };
    const inner = $('.cap-in', cap);
    inner.addEventListener('pointerdown', e => {
      const r = inner.getBoundingClientRect();
      const go = ev => T.seek(clamp(((ev.clientX - r.left) / r.width - r0) / (r1 - r0), 0, 1) * T.dur());
      go(e); inner.setPointerCapture(e.pointerId);
      const up = () => { inner.removeEventListener('pointermove', go); inner.removeEventListener('pointerup', up); };
      inner.addEventListener('pointermove', go); inner.addEventListener('pointerup', up);
    });
  }
  setTimeout(emit, 0);
  return T;
}
/* Fausse timeline (quand aucune capture n'est fournie) */
function fakeEdit(p, dur) {
  const r = rng(p.id), base = slug(p.short || p.title).toUpperCase().slice(0, 10) || 'CLIP';
  const v1 = []; let t = 0, k = 1;
  while (t < dur - 0.2) { const d = Math.min(dur - t, 1.4 + r() * 4.6); v1.push({ s: t, d, n: `A${pad(k)}_${base}_${pad(Math.floor(r() * 90) + 10)}.mov`, k: k++ }); t += d; }
  const v2 = []; for (let i = 0; i < Math.max(2, Math.round(dur / 25)); i++) { const s = (i + 0.15 + r() * 0.4) * dur / Math.max(2, Math.round(dur / 25)); v2.push({ s, d: Math.min(dur - s, 2 + r() * 3), n: i === 0 ? 'Titre' : 'Texte ' + i }); }
  const a1 = v1.filter(() => r() > 0.45).map(c => ({ s: c.s, d: c.d * (0.6 + r() * 0.4), n: c.n.replace('.mov', '.wav') }));
  return { v1, v2, a1 };
}
function rulerMarks(total, fmt) {
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300]; const step = steps.find(s => total / s <= 9) || 600;
  let out = ''; for (let s = 0; s <= total; s += step) out += `<span style="left:${(s / total * 100).toFixed(3)}%">${fmt(s)}</span>`;
  return out;
}

/* ==================================================================
   CARTE DE RENDU (exportation)
   ================================================================== */
function startRender(rec, { file, frames, app, onDone }) {
  const card = $('.render-card', rec.body);
  if (!card || card.classList.contains('busy')) return;
  card.classList.remove('hidden', 'done'); card.classList.add('busy');
  card.innerHTML = `<div class="rc-top"><b class="rc-t">Rendu en cours…</b><button class="rc-x" aria-label="Annuler">${G.close}</button></div>
    <div class="rc-file">${G.film}<span>${esc(file)}</span><em class="mono">H.264 · 3840×2160</em></div>
    <div class="rc-bar"><i></i></div>
    <div class="rc-stats mono"><span class="rc-p">0 %</span><span class="rc-f">Image 0 / ${frames}</span><span class="rc-eta">Restant —</span></div>`;
  let f = 0;
  const fill = $('.rc-bar i', card);
  const stop = () => { clearInterval(rec.renderTimer); rec.renderTimer = null; };
  const hide = () => { card.classList.add('hidden'); card.classList.remove('busy', 'done'); };
  $('.rc-x', card).addEventListener('click', () => { stop(); hide(); });
  rec.renderTimer = setInterval(() => {
    f = Math.min(frames, f + frames * (0.012 + Math.random() * 0.016));
    const p = f / frames * 100;
    fill.style.transform = `scaleX(${p / 100})`;
    $('.rc-p', card).textContent = Math.floor(p) + ' %';
    $('.rc-f', card).textContent = `Image ${Math.floor(f)} / ${frames}`;
    $('.rc-eta', card).textContent = `Restant ${mmss(Math.max(0, (100 - p) / 100 * 6))}`;
    if (f >= frames) {
      stop(); card.classList.add('done'); $('.rc-t', card).textContent = 'Rendu terminé'; $('.rc-eta', card).textContent = 'Terminé';
      notify({ title: 'Rendu terminé', body: `${file} a été exporté avec succès.`, ic: APPS[app].icon, app: APPS[app].name });
      if (onDone) onDone();
      setTimeout(hide, 2400);
    }
  }, 120);
}

/* ==================================================================
   DAVINCI RESOLVE — page Montage (interface réelle)
   ================================================================== */
const si = (inner, sw = 1.5) => sv(inner, sw);
const RVI = {
  pool: si('<rect x="3.5" y="5" width="7" height="6" rx="1"/><rect x="13.5" y="5" width="7" height="6" rx="1"/><rect x="3.5" y="13.5" width="7" height="6" rx="1"/><rect x="13.5" y="13.5" width="7" height="6" rx="1"/>'),
  fx: si('<path d="M5 19l9-9M14 10l2-2M17 4v3M15.5 5.5h3M19.5 10v2M18.5 11h2M9 4v2M8 5h2"/>'),
  index: si('<path d="M4 6h3M9 6h11M4 12h3M9 12h11M4 18h3M9 18h11"/>'),
  sound: si('<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>'),
  mixer: si('<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3" rx=".8" fill="currentColor"/><rect x="10" y="7" width="4" height="3" rx=".8" fill="currentColor"/><rect x="16" y="11" width="4" height="3" rx=".8" fill="currentColor"/>'),
  meta: si('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 12.5h8M8 16h5"/>'),
  insp: si('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  media: si('<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M3.5 9.5h17M7.5 6v3.5M12 6v3.5M16.5 6v3.5"/>'),
  cut: si('<path d="M4 8h7M14 8h6M4 12h4M11 12h9M4 16h10M17 16h3"/>'),
  edit: si('<path d="M4 7h9M6 12h14M4 17h7M15.5 4v16"/>'),
  fusion: si('<circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="4.8" r="1.7"/><circle cx="18.4" cy="16" r="1.7"/><circle cx="5.6" cy="16" r="1.7"/><path d="M12 6.5v3M16.9 15.1l-2.6-1.6M7.1 15.1l2.6-1.6"/>'),
  color: si('<circle cx="12" cy="9" r="4.5"/><circle cx="9" cy="14.5" r="4.5"/><circle cx="15" cy="14.5" r="4.5"/>'),
  fairlight: si('<path d="M3.5 12h2l2-5 3 10 3-13 3 11 2-3h2"/>'),
  deliver: si('<path d="M14.5 4.5c3 0 5 2 5 5-1.5 3-4.5 6-8 7.5l-4-4c1.5-3.5 4.5-6.5 7-8.5z"/><circle cx="15" cy="9" r="1.5"/><path d="M7.5 13l-3 1 2-4h3M11 16.5l-1 3 4-2v-3M6 18l-1.5 1.5"/>'),
  select: si('<path d="M6 4l11 7.5-5 1 3 6-2 1-3-6-4 3.5z" fill="currentColor"/>'),
  trim: si('<path d="M9 5v14M15 5v14M5 9l4 3-4 3M19 9l-4 3 4 3"/>'),
  dyn: si('<path d="M12 5v14M7 9l-3 3 3 3M17 9l3 3-3 3"/>'),
  blade: si('<path d="M7 20l5-9M12 11l6-7-1 7z"/>'),
  insert: si('<rect x="4" y="9" width="6" height="6" rx="1"/><rect x="14" y="9" width="6" height="6" rx="1"/><path d="M12 4v6M10 8l2 2 2-2"/>'),
  over: si('<rect x="5" y="9" width="14" height="6" rx="1"/><path d="M12 3v5M10 6l2 2 2-2"/>'),
  replace: si('<rect x="6" y="8" width="12" height="8" rx="1"/><path d="M9 12h6M13 10l2 2-2 2"/>'),
  snap: si('<path d="M7 4v8a5 5 0 0 0 10 0V4M7 8h3M14 8h3"/>'),
  link: si('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  lock: si('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  flag: si('<path d="M6 20V4.5h10l-2 4 2 4H6"/>'),
  marker: si('<path d="M7 4h10v11l-5 5-5-5z"/>'),
  audioTrack: si('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/>'),
  monitor: si('<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M9 19h6"/>')
};
const RV_PAGES = [['media', 'Média'], ['cut', 'Cut'], ['edit', 'Montage'], ['fusion', 'Fusion'], ['color', 'Étalonnage'], ['fairlight', 'Fairlight'], ['deliver', 'Exportation']];
const resolveList = () => [REEL, ...CONFIG.projects.filter(x => appFor(x) === 'resolve')];
const rvTC = s => tc(3600 + s);

function openResolve(p, from) {
  const list = resolveList();
  p = p || list.find(x => x.video) || list[0];
  const ex = WM.list.get('app-resolve');
  if (ex) { if (ex.minimized) WM.restore(ex.id); else WM.focus(ex.id); ex.state.load(p); return; }
  WM.open('app-resolve', { app: 'resolve', kind: 'resolve', title: `DaVinci Resolve - ${p.short}`, w: 1260, h: 780, cls: 'win-dark win-pro win-rv', minW: 720, from, build: (body, rec) => buildResolve(body, rec, p) });
}

function buildResolve(body, rec, first) {
  const list = resolveList();
  body.innerHTML = `<div class="rv pg-edit">
    <div class="rv-bar">
      <div class="rv-bar-l">
        <button class="rv-tb on" data-tb="pool">${RVI.pool}<span>Pool de médias</span></button>
        <button class="rv-tb" data-tb="fx">${RVI.fx}<span>Effets</span></button>
        <button class="rv-tb" data-tb="index">${RVI.index}<span>Index de montage</span></button>
        <button class="rv-tb" data-tb="sound">${RVI.sound}<span>Bibliothèque de sons</span></button>
      </div>
      <div class="rv-proj"><b class="rv-pname"></b><span>Modifié</span></div>
      <div class="rv-bar-r">
        <button class="rv-tb" data-tb="mixer">${RVI.mixer}<span>Mixeur</span></button>
        <button class="rv-tb on" data-tb="meta">${RVI.meta}<span>Métadonnées</span></button>
        <button class="rv-tb" data-tb="insp">${RVI.insp}<span>Inspecteur</span></button>
      </div>
    </div>
    <div class="rv-main">
      <section class="rv-pnl rv-pool">
        <header class="rv-phd"><span>Master</span><span class="rv-phd-ic">${G.grid}${G.list}${G.search}</span></header>
        <div class="rv-pool-in">
          <div class="rv-bins"><div class="rv-bin on">${G.down}Master</div><div class="rv-bin sub">Projets</div><div class="rv-bin sub">Musiques</div><div class="rv-bin hd">Power Bins</div><div class="rv-bin hd">Smart Bins</div></div>
          <div class="rv-clips">${list.map(p => `<button class="rv-clip" data-id="${p.id}"><div class="rv-cth">${poster(p, { label: false })}<span class="mono">${esc(p.duration)}</span></div><span class="rv-cn">${esc(fileName(p))}</span></button>`).join('')}</div>
        </div>
      </section>
      <section class="rv-pnl rv-render">
        <header class="rv-phd"><span>Paramètres de rendu</span><span class="rv-phd-ic">${G.more}</span></header>
        <div class="rv-presets">${['Personnalisé', 'H.264 Master', 'YouTube', 'Vimeo', 'TikTok'].map((t, i) => `<span class="${i === 0 ? 'on' : ''}">${RVI.deliver}<b>${t}</b></span>`).join('')}</div>
        <div class="rv-form">
          <label>Nom du fichier<input class="rv-fname" value=""></label>
          <label>Emplacement<input value="/Volumes/Projets/Exports" readonly></label>
          <div class="rv-row2"><label>Format<select><option>MP4</option><option>QuickTime</option></select></label><label>Codec<select><option>H.264</option><option>H.265</option><option>Apple ProRes 422 HQ</option></select></label></div>
          <div class="rv-row2"><label>Résolution<select><option>3840 x 2160 Ultra HD</option><option>1920 x 1080 HD</option></select></label><label>Fréquence<select><option>25</option><option>24</option><option>50</option></select></label></div>
          <button class="rv-btn" data-a="queue">Ajouter à la file d'attente</button>
        </div>
      </section>
      <section class="rv-pnl rv-view">
        <header class="rv-phd"><span class="rv-zoom">Adapter ${G.down}</span><span class="rv-tlname"></span><span class="rv-vtc mono">01:00:00:00</span></header>
        <div class="rv-screen"><div class="rv-frame"></div><div class="rv-msg"></div></div>
        <div class="rv-jog"><div class="rv-jog-tr"><i class="rv-jog-ph"></i></div></div>
        <div class="rv-trans">
          <span class="rv-tr-l mono rv-durtc"></span>
          <div class="rv-tr-c">
            <button data-t="start" aria-label="Début">${G.skipb}</button><button data-t="rew" aria-label="Retour rapide">${G.rew}</button>
            <button data-t="stop" aria-label="Stop">${G.stop}</button><button data-t="play" class="rv-play" aria-label="Lecture">${G.play}</button>
            <button data-t="ff" aria-label="Avance rapide">${G.ff}</button><button data-t="end" aria-label="Fin">${G.skipf}</button><button data-t="loop" class="on" aria-label="Boucle">${G.loop}</button>
          </div>
          <span class="rv-tr-r">${RVI.monitor}</span>
        </div>
      </section>
      <section class="rv-pnl rv-side">
        <header class="rv-phd"><span class="rv-side-t">Métadonnées</span><span class="rv-phd-ic">${G.more}</span></header>
        <div class="rv-side-in"></div>
      </section>
      <section class="rv-pnl rv-queue">
        <header class="rv-phd"><span>File d'attente de rendu</span><span class="rv-phd-ic">${G.more}</span></header>
        <div class="rv-jobs"><p class="rv-nojob">Aucune tâche dans la file d'attente</p></div>
        <div class="rv-qfoot"><button class="rv-btn primary" data-a="renderall">Tout rendre</button></div>
      </section>
      <section class="rv-pnl rv-nodes">
        <header class="rv-phd"><span>Nœuds</span><span class="rv-phd-ic">${G.more}</span></header>
        <div class="rv-graph"><i class="rv-in"></i><div class="rv-node"><div class="rv-nth"></div><b>01</b></div><div class="rv-node n2"><div class="rv-nth"></div><b>02</b></div><i class="rv-out"></i><svg class="rv-wires" viewBox="0 0 300 120" preserveAspectRatio="none"><path d="M18 60C50 60 50 60 70 60M150 60C170 60 170 60 190 60M270 60C280 60 282 60 288 60" stroke="#62c26b" stroke-width="2" fill="none"/></svg></div>
      </section>
    </div>
    <section class="rv-pnl rv-tl">
      <div class="rv-tlbar">
        <span class="rv-tltc mono">01:00:00:00</span>
        <div class="rv-tools">
          <span class="g">${['select', 'trim', 'dyn', 'blade'].map((k, i) => `<button class="${i === 0 ? 'on' : ''}" data-tool="${k}">${RVI[k]}</button>`).join('')}</span>
          <span class="g">${['insert', 'over', 'replace'].map(k => `<button>${RVI[k]}</button>`).join('')}</span>
          <span class="g">${['snap', 'link', 'lock'].map((k, i) => `<button class="${i < 2 ? 'on' : ''}" data-tog>${RVI[k]}</button>`).join('')}</span>
          <span class="g">${['flag', 'marker'].map(k => `<button>${RVI[k]}</button>`).join('')}</span>
        </div>
        <div class="rv-tlz">${G.minus}<i><b></b></i>${G.plus}</div>
      </div>
      <div class="rv-tlbody"></div>
    </section>
    <section class="rv-pnl rv-color">
      <header class="rv-phd"><span>Primaires — Roues chromatiques</span><span class="rv-phd-ic">${G.more}</span></header>
      <div class="rv-cbars mono"><span>Contraste <b>1.000</b></span><span>Pivot <b>0.435</b></span><span>Sat <b>50.00</b></span><span>Teinte <b>50.00</b></span><span>Mix lum. <b>100.00</b></span></div>
      <div class="rv-wheels">${['Lift', 'Gamma', 'Gain', 'Offset'].map((n, i) => `<div class="rv-wheel"><span>${n}</span><div class="rv-wh"><i></i></div><div class="rv-whv mono"><b>${i === 3 ? '25.00' : '0.00'}</b><b>${i === 3 ? '25.00' : '0.00'}</b><b>${i === 3 ? '25.00' : '0.00'}</b><b>${i === 3 ? '25.00' : '0.00'}</b></div><em class="mono">Y R G B</em></div>`).join('')}</div>
    </section>
    <nav class="rv-pages">
      <div class="rv-brand">${icon('resolve')}<span>DaVinci Resolve 19</span></div>
      <div class="rv-pg">${RV_PAGES.map(([k, l]) => `<button data-page="${k}" class="${k === 'edit' ? 'on' : ''}">${RVI[k]}<span>${l}</span></button>`).join('')}</div>
      <div class="rv-pg-r">${G.home}${G.gear}</div>
    </nav>
    <div class="render-card hidden"></div>
  </div>`;

  const root = $('.rv', body);
  const st = { p: null, T: null, loop: true, side: 'meta', page: 'edit', jobs: [] };
  rec.state = st;
  const screen = $('.rv-screen', body), playBtn = $('.rv-play', body), tcs = $$('.rv-vtc, .rv-tltc', body);
  const jogPh = $('.rv-jog-ph', body);

  function sideHTML(p, T) {
    const d = T ? T.dur() : (durSec(p.duration) || 30);
    if (st.side === 'insp') {
      const row = (l, a, b) => `<div class="rv-ir"><span>${l}</span><i class="rv-sl"><b style="width:${30 + (l.length * 7) % 40}%"></b></i><em class="mono">${a}</em>${b !== undefined ? `<em class="mono">${b}</em>` : ''}</div>`;
      return `<div class="rv-itabs"><span class="on">Vidéo</span><span>Audio</span><span>Effet</span><span>Transition</span><span>Image</span><span>Fichier</span></div>
        <div class="rv-ig"><div class="rv-igh">${G.down}Transformation</div>${row('Zoom', '1.000', '1.000')}${row('Position', '0.000', '0.000')}${row('Angle de rotation', '0.000')}${row('Point d\'ancrage', '0.000', '0.000')}${row('Tangage', '0.000')}${row('Lacet', '0.000')}</div>
        <div class="rv-ig"><div class="rv-igh">${G.down}Rognage</div>${row('Rognage gauche', '0.000')}${row('Rognage droit', '0.000')}${row('Adoucissement', '0.000')}</div>
        <div class="rv-ig"><div class="rv-igh">${G.down}Composite</div>${row('Opacité', '100.00')}</div>`;
    }
    return `<div class="rv-mtop"><div class="rv-mth">${poster(p, { label: false })}</div><div><b>${esc(fileName(p))}</b><small class="mono">${rvTC(0)} — ${rvTC(d)}</small><small>${esc(p.client)}</small></div></div>
      <div class="rv-mg"><div class="rv-mgh">${G.down}Plan et scène</div>
        <div class="rv-mr"><span>Description</span><p>${esc(p.description)}</p></div>
        <div class="rv-mr"><span>Client</span><p>${esc(p.client)}</p></div>
        <div class="rv-mr"><span>Rôle</span><p>${esc(p.role)}</p></div>
        <div class="rv-mr"><span>Année</span><p>${esc(p.year)}</p></div>
        <div class="rv-mr"><span>Mots-clés</span><p class="rv-kw">${(p.tags || []).map(t => `<i>${esc(t)}</i>`).join('')}</p></div>
        <div class="rv-mr"><span>Logiciels</span><p>${(p.tools || []).map(esc).join(', ')}</p></div></div>
      <div class="rv-mg"><div class="rv-mgh">${G.down}Détails du clip</div>
        <div class="rv-mr"><span>TC de début</span><p class="mono">${rvTC(0)}</p></div>
        <div class="rv-mr"><span>TC de fin</span><p class="mono">${rvTC(d)}</p></div>
        <div class="rv-mr"><span>Durée</span><p class="mono">${tc(d)}</p></div>
        <div class="rv-mr"><span>Images</span><p class="mono">${Math.round(d * 25)}</p></div>
        <div class="rv-mr"><span>Codec vidéo</span><p>${isVideoFile(p.video) ? 'H.264' : 'Apple ProRes 422 HQ'}</p></div>
        <div class="rv-mr"><span>Résolution</span><p>3840 x 2160</p></div>
        <div class="rv-mr"><span>Fréquence d'images</span><p>25.000</p></div></div>
      <div class="rv-mfoot"><button class="rv-btn" data-a="ql">${G.expand} Plein écran</button></div>`;
  }
  function timelineHTML(p, d) {
    if (p.timeline) return captureHTML(p, 'rv-cap');
    const E = fakeEdit(p, d), L = x => (x / d * 100).toFixed(3), W = x => (x / d * 100).toFixed(3);
    return `<div class="rv-gen">
      <div class="rv-heads"><div class="rv-hruler"></div>
        <div class="rv-hd v"><b>V2</b><span>Vidéo 2</span><i>${RVI.lock}${RVI.monitor}</i></div>
        <div class="rv-hd v"><b>V1</b><span>Vidéo 1</span><i>${RVI.lock}${RVI.monitor}</i></div>
        <div class="rv-hd a"><b>A1</b><span>Audio 1</span><em>2.0</em><i><u>S</u><u>M</u></i></div>
        <div class="rv-hd a"><b>A2</b><span>Musique</span><em>2.0</em><i><u>S</u><u>M</u></i></div></div>
      <div class="rv-lanes">
        <div class="rv-ruler">${rulerMarks(d, s => rvTC(s).slice(0, 8))}</div>
        <div class="rv-lane">${E.v2.map(c => `<div class="rv-blk ttl" style="left:${L(c.s)}%;width:${W(c.d)}%"><span>${esc(c.n)}</span></div>`).join('')}</div>
        <div class="rv-lane">${E.v1.map(c => `<div class="rv-blk vid" style="left:${L(c.s)}%;width:${W(c.d)}%;--c1:${p.colors[0]};--c2:${p.colors[1]}"><span>${esc(c.n)}</span><i></i></div>`).join('')}</div>
        <div class="rv-lane">${E.a1.map(c => `<div class="rv-blk aud" style="left:${L(c.s)}%;width:${W(c.d)}%"><span>${esc(c.n)}</span>${wave(c.n, 24)}</div>`).join('')}</div>
        <div class="rv-lane"><div class="rv-blk aud mus" style="left:0;width:100%"><span>Musique — ${esc(p.short)}.wav</span>${wave('m' + p.id, 220)}</div></div>
        <div class="rv-head"><i></i></div>
      </div></div>`;
  }
  function load(p) {
    if (!p) return;
    if (st.T) st.T.destroy();
    st.p = p;
    rec.setTitle(`DaVinci Resolve - ${p.short}`);
    $('.rv-pname', body).textContent = p.title;
    $('.rv-tlname', body).innerHTML = `${esc(p.short)} ${G.down}`;
    $('.rv-fname', body).value = slug(p.short) || 'Export';
    $$('.rv-clip', body).forEach(c => c.classList.toggle('on', c.dataset.id === p.id));
    $('.rv-frame', body).innerHTML = viewerMediaHTML(p);
    $$('.rv-nth', body).forEach(n => { n.innerHTML = poster(p, { label: false }); });
    const d0 = durSec(p.duration) || 30;
    $('.rv-tlbody', body).innerHTML = timelineHTML(p, d0);
    $('.rv-side-in', body).innerHTML = sideHTML(p);
    const lanes = $('.rv-lanes', body);
    st.cb = {
      loop: st.loop,
      onTick: (t, d) => {
        const s = rvTC(t); tcs.forEach(e => { e.textContent = s; });
        const f = (t / d * 100).toFixed(3) + '%';
        jogPh.style.left = f; const hd = $('.rv-head', body); if (hd) hd.style.left = f;
      },
      onState: on => { playBtn.innerHTML = on ? G.pause : G.play; screen.classList.toggle('playing', on); }
    };
    st.T = createTransport(root, p, st.cb);
    $('.rv-durtc', body).textContent = tc(st.T.dur());
    const v = $('video.vx', body);
    if (v) v.addEventListener('loadedmetadata', () => { $('.rv-durtc', body).textContent = tc(st.T.dur()); if (!p.timeline) { $('.rv-tlbody', body).innerHTML = timelineHTML(p, st.T.dur()); wireLanes(); } $('.rv-side-in', body).innerHTML = sideHTML(p, st.T); }, { once: true });
    if (lanes) wireLanes();
    if (st.T.external) flash('Lecture depuis la vidéo intégrée (YouTube / Vimeo)');
  }
  function wireLanes() {
    const lanes = $('.rv-lanes', body); if (!lanes) return;
    const head = $('.rv-head', body);
    if (head) head.style.left = (st.T.t / st.T.dur() * 100) + '%';
    lanes.addEventListener('pointerdown', e => {
      const r = lanes.getBoundingClientRect();
      const go = ev => st.T.seek(clamp((ev.clientX - r.left) / r.width, 0, 1) * st.T.dur());
      go(e); lanes.setPointerCapture(e.pointerId);
      const up = () => { lanes.removeEventListener('pointermove', go); lanes.removeEventListener('pointerup', up); };
      lanes.addEventListener('pointermove', go); lanes.addEventListener('pointerup', up);
    });
  }
  let flashT;
  function flash(msg) { const m = $('.rv-msg', body); m.textContent = msg; m.classList.add('on'); clearTimeout(flashT); flashT = setTimeout(() => m.classList.remove('on'), 2200); }
  st.load = load;

  // transport
  $('.rv-trans', body).addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b || !st.T) return; const T = st.T, k = b.dataset.t;
    if (k === 'play') T.toggle();
    else if (k === 'stop') { T.pause(); T.seek(0); }
    else if (k === 'start') T.seek(0);
    else if (k === 'end') T.seek(T.dur());
    else if (k === 'rew') T.step(-5);
    else if (k === 'ff') T.step(5);
    else if (k === 'loop') { st.loop = !st.loop; b.classList.toggle('on', st.loop); if (st.cb) st.cb.loop = st.loop; }
  });
  screen.addEventListener('click', e => { if (!e.target.closest('iframe') && st.T) st.T.toggle(); });
  const jog = $('.rv-jog-tr', body);
  jog.addEventListener('pointerdown', e => {
    const r = jog.getBoundingClientRect(); const go = ev => st.T.seek(clamp((ev.clientX - r.left) / r.width, 0, 1) * st.T.dur());
    go(e); jog.setPointerCapture(e.pointerId);
    const up = () => { jog.removeEventListener('pointermove', go); jog.removeEventListener('pointerup', up); };
    jog.addEventListener('pointermove', go); jog.addEventListener('pointerup', up);
  });
  // pool de médias
  const clips = $('.rv-clips', body);
  clips.addEventListener('click', e => { const c = e.target.closest('.rv-clip'); if (c) load(byId(c.dataset.id)); });
  // barre d'outils supérieure
  $('.rv-bar', body).addEventListener('click', e => {
    const b = e.target.closest('[data-tb]'); if (!b) return; const k = b.dataset.tb;
    if (k === 'pool') { b.classList.toggle('on'); root.classList.toggle('no-pool', !b.classList.contains('on')); }
    else if (k === 'meta' || k === 'insp') {
      st.side = k; $$('[data-tb="meta"], [data-tb="insp"]', body).forEach(x => x.classList.toggle('on', x.dataset.tb === k));
      $('.rv-side-t', body).textContent = k === 'meta' ? 'Métadonnées' : 'Inspecteur'; root.classList.remove('no-side');
      $('.rv-side-in', body).innerHTML = sideHTML(st.p, st.T);
    } else flash(`${$('span', b).textContent} : non utilisé dans cette démo`);
  });
  $('.rv-side', body).addEventListener('click', e => { if (e.target.closest('[data-a="ql"]')) { st.T.pause(); quickLook(st.p, e.target.getBoundingClientRect()); } });
  $('.rv-tools', body).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) $$('[data-tool]', body).forEach(x => x.classList.toggle('on', x === b));
    else if (b.hasAttribute('data-tog')) b.classList.toggle('on');
  });
  // pages
  $('.rv-pg', body).addEventListener('click', e => {
    const b = e.target.closest('[data-page]'); if (!b) return; const k = b.dataset.page;
    const page = k === 'cut' ? 'edit' : k;
    if (!['edit', 'color', 'deliver'].includes(page)) { flash(`Page ${$('span', b).textContent} : non utilisée sur ce projet`); return; }
    $$('.rv-pg button', body).forEach(x => x.classList.toggle('on', x === b));
    root.className = root.className.replace(/pg-\w+/, 'pg-' + page);
    st.page = page;
  });
  // exportation
  const addJob = () => {
    const name = ($('.rv-fname', body).value || 'Export') + '.mp4';
    st.jobs.push({ name, p: st.p, done: false });
    renderJobs();
  };
  const renderJobs = () => {
    $('.rv-jobs', body).innerHTML = st.jobs.length ? st.jobs.map((j, i) => `<div class="rv-job ${j.done ? 'done' : ''}"><b>Tâche ${i + 1}</b><span>${esc(j.p.short)} | ${esc(j.name)}</span><small>${j.done ? 'Terminé' : 'MP4 · H.264 · 3840 x 2160 · 25 i/s'}</small></div>`).join('') : '<p class="rv-nojob">Aucune tâche dans la file d\'attente</p>';
  };
  body.addEventListener('click', e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'queue') addJob();
    if (a.dataset.a === 'renderall') {
      if (!st.jobs.some(j => !j.done)) addJob();
      const job = st.jobs.find(j => !j.done);
      startRender(rec, { file: job.name, frames: Math.round((durSec(job.p.duration) || 30) * 25), app: 'resolve', onDone: () => { job.done = true; renderJobs(); } });
    }
  });
  rec.onkey = e => {
    if (!st.T) return;
    if (e.key === ' ' || e.key.toLowerCase() === 'k') { e.preventDefault(); st.T.toggle(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); st.T.step(-1 / 25); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); st.T.step(1 / 25); }
    else if (e.key.toLowerCase() === 'l') st.T.play();
    else if (e.key.toLowerCase() === 'j') st.T.step(-2);
    else if (e.key === 'Home') st.T.seek(0);
  };
  rec.onhide = () => st.T && st.T.pause();
  rec.onclose = () => { if (st.T) st.T.destroy(); clearInterval(rec.renderTimer); };
  load(first);
}

/* ==================================================================
   AFTER EFFECTS (interface réelle)
   ================================================================== */
const AEI = {
  home: si('<path d="M4 11l8-6.5 8 6.5M6 9.5V19h4.5v-5h3v5H18V9.5"/>'),
  sel: si('<path d="M6 4l11 7.5-5 1 3 6-2 1-3-6-4 3.5z" fill="currentColor"/>'),
  hand: si('<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V13M8 12V9.5a1.5 1.5 0 0 0-3 0V14c0 4 2.5 6.5 6.5 6.5S17 18 17 14v-1"/>'),
  zoom: si('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>'),
  rot: si('<path d="M18 9a7 7 0 1 0 1 5"/><path d="M19 4v5h-5"/>'),
  orbit: si('<rect x="7" y="9" width="10" height="7" rx="1"/><path d="M9 9l1.5-2.5h3L15 9M4 12a8 4 0 0 0 16 0"/>'),
  anchor: si('<circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21"/>'),
  rect: si('<rect x="5" y="6" width="14" height="12" rx="1"/>'),
  pen: si('<path d="M12 3l6 10-6 7-6-7z"/><circle cx="12" cy="12" r="1.5"/>'),
  type: '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="18" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="currentColor">T</text></svg>',
  brush: si('<path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M6.5 12.5c-2 .5-3 2.5-3 4.5 0 1.5-.5 2.5-1.5 3 3 0 7-1 8-3.5"/>'),
  clone: si('<path d="M9 4h6v5l3 3H6l3-3z"/><path d="M6 14h12v3H6zM8 17v3h8v-3"/>'),
  eraser: si('<path d="M4 15l8-9 8 8-6 6H8z"/><path d="M9 10l7 7"/>'),
  roto: si('<path d="M5 19c2-6 6-10 14-14"/><circle cx="7" cy="17" r="2.5"/>'),
  puppet: si('<circle cx="12" cy="5.5" r="2"/><path d="M12 7.5v7M7 10l5 2 5-2M9 21l3-6.5 3 6.5"/>'),
  comp: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="1.5" fill="#6a7cc9"/><path d="M5 3v10M11 3v10M1.5 8h13" stroke="#2c3567" stroke-width="1"/></svg>',
  footage: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1" fill="#7c7c7c"/><path d="M6.5 6v4l3.5-2z" fill="#e8e8e8"/></svg>',
  audio: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1" fill="#4e9a62"/><path d="M4 8h1l1-3 2 6 2-5 1 2h1" stroke="#dff5e4" stroke-width="1" fill="none"/></svg>',
  folder: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 4.5a1 1 0 0 1 1-1h3.5l1.5 1.5h6a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z" fill="#d6b45a"/></svg>',
  solid: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11" rx="1" fill="#9a9a9a"/></svg>',
  lyText: '<svg viewBox="0 0 16 16" aria-hidden="true"><text x="8" y="12.5" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="currentColor">T</text></svg>',
  lyShape: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2l1.8 3.8 4.2.5-3.1 2.8.9 4.1L8 11.1l-3.8 2.1.9-4.1L2 6.3l4.2-.5z" fill="currentColor"/></svg>',
  lyNull: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  lyAdj: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 3a5 5 0 0 1 0 10z" fill="currentColor"/></svg>',
  eye: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8S4 4 8 4s6.5 4 6.5 4S12 12 8 12 1.5 8 1.5 8z" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/></svg>',
  spk: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6h2.5L8.5 3v10L5 10H2.5z" fill="currentColor"/></svg>'
};
const AE_LABELS = ['#e15e5e', '#e4d84c', '#a9cbc7', '#e5bcc9', '#a9a9ca', '#e7c19e', '#b3c7b3', '#677de0', '#4aa44c', '#8e2c9a', '#e8920d'];
const aeList = () => { const l = CONFIG.projects.filter(x => appFor(x) === 'ae'); return l.length ? l : CONFIG.projects.filter(x => x.type === 'motion').concat(CONFIG.projects.slice(0, 2)).slice(0, 3); };
const aeTC = s => { const f = Math.floor((s % 1) * 25); s = Math.floor(s); return `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`; };

function openAE(p, from) {
  const list = aeList();
  p = p || list[0];
  const ex = WM.list.get('app-ae');
  if (ex) { if (ex.minimized) WM.restore(ex.id); else WM.focus(ex.id); ex.state.load(p); return; }
  WM.open('app-ae', { app: 'ae', kind: 'ae', title: `Adobe After Effects ${new Date().getFullYear()} - ${slug(p.short)}.aep`, w: 1260, h: 780, cls: 'win-dark win-pro win-ae', minW: 720, from, build: (body, rec) => buildAE(body, rec, p) });
}
function compArtHTML(p) {
  const word = (p.short || p.title).toUpperCase();
  const r = rng(p.id);
  const parts = Array.from({ length: 10 }, (_, i) => `<i style="--x:${(r() * 90 + 5).toFixed(1)}%;--y:${(r() * 80 + 10).toFixed(1)}%;--d:${(r() * 1.6).toFixed(2)}s;--s:${(3 + r() * 6).toFixed(1)}px"></i>`).join('');
  return `<div class="vx vx-fake ca" style="--c1:${p.colors[0]};--c2:${p.colors[1]};--t:0s">
    <i class="ca-bg"></i><i class="ca-ring"></i><i class="ca-circle"></i><i class="ca-bar"></i>
    <div class="ca-title">${[...word].map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</div>
    <div class="ca-sub">${esc(p.client)}</div><div class="ca-parts">${parts}</div></div>`;
}
function aeLayers(p, d) {
  const r = rng('ae' + p.id), base = slug(p.short) || 'clip';
  const L = [
    { n: (p.short || 'Titre').toUpperCase(), ic: 'lyText', mode: 'Normal' },
    { n: p.client, ic: 'lyText', mode: 'Normal' },
    { n: 'Forme 1', ic: 'lyShape', mode: 'Écran' },
    { n: 'Nul 1', ic: 'lyNull', mode: 'Normal' },
    { n: 'Calque d\'effets 1', ic: 'lyAdj', mode: 'Normal' },
    { n: `${base}_fond.mp4`, ic: 'footage', mode: 'Normal' },
    { n: 'musique.wav', ic: 'audio', mode: '' }
  ];
  return L.map((l, i) => {
    const s = i < 5 ? r() * d * 0.25 : 0, e = i < 3 ? d * (0.6 + r() * 0.4) : d;
    const keys = i < 5 ? Array.from({ length: 2 + Math.floor(r() * 3) }, () => s + r() * (e - s)).sort((a, b) => a - b) : [];
    return { ...l, c: AE_LABELS[(i * 3 + 1) % AE_LABELS.length], s, e, keys };
  });
}
function buildAE(body, rec, first) {
  const list = aeList();
  const tools = [['home'], ['sel', 'hand', 'zoom'], ['rot', 'orbit', 'anchor'], ['rect', 'pen', 'type'], ['brush', 'clone', 'eraser'], ['roto', 'puppet']];
  body.innerHTML = `<div class="ae">
    <div class="ae-toolbar">
      ${tools.map((g, gi) => `<span class="ae-tg">${g.map((k, i) => `<button class="${gi === 1 && i === 0 ? 'on' : ''}" data-tool="${k}" aria-label="${k}">${AEI[k]}</button>`).join('')}</span>`).join('')}
      <span class="ae-sp"></span>
      <span class="ae-ws"><b class="on">Défaut</b><b>Apprentissage</b><b>Standard</b><b>Petit écran</b><b>Bibliothèques</b><em>»</em></span>
      <button class="ae-help">${G.search}</button>
    </div>
    <div class="ae-main">
      <section class="ae-pnl ae-proj">
        <div class="ae-tabs"><span class="on">Projet ≡</span><span>Options d'effet <i>(aucune)</i></span></div>
        <div class="ae-pprev"><div class="ae-pth"></div><div class="ae-pinfo"><b class="ae-pn"></b><small>1920 x 1080 (1,00)</small><small class="ae-pd mono"></small></div></div>
        <label class="ae-search">${G.search}<input aria-label="Rechercher dans le projet"></label>
        <div class="ae-ptable">
          <div class="ae-prow hd"><span>Nom</span><span>Type</span><span>Taille</span><span>Fréquence</span></div>
          ${list.map(p => `<button class="ae-prow comp" data-id="${p.id}"><span>${AEI.comp}${esc(p.short)}</span><span>Composition</span><span></span><span>25</span></button>`).join('')}
          <div class="ae-prow"><span>${AEI.folder}Solides</span><span>Dossier</span><span></span><span></span></div>
          <div class="ae-prow"><span>${AEI.footage}rushes_4k.mp4</span><span>MPEG</span><span>842 Mo</span><span>25</span></div>
          <div class="ae-prow"><span>${AEI.audio}musique.wav</span><span>WAV</span><span>31 Mo</span><span></span></div>
        </div>
        <div class="ae-pfoot"><span>${G.folder}${G.plus}${G.trash}</span><b class="mono">8 bpc</b></div>
      </section>
      <section class="ae-pnl ae-comp">
        <div class="ae-tabs"><span class="on">Composition <b class="ae-cn"></b> ≡</span><span>Calque <i>(aucun)</i></span><span>Métrage <i>(aucun)</i></span></div>
        <div class="ae-crumb"><span class="ae-cn2"></span></div>
        <div class="ae-stage"><div class="ae-frame"></div><div class="ae-msg"></div></div>
        <div class="ae-cbar mono"><span>(50 %)</span><span>${G.camera}</span><span class="ae-ctc">0:00:00:00</span><span>Complète</span><span>Caméra active</span><span>1 vue</span><span class="ae-cplay">${G.play}</span></div>
      </section>
      <section class="ae-pnl ae-right">
        <div class="ae-acc"><div class="ae-acch on">Infos</div><div class="ae-accb ae-info mono"><span>R :</span><b>255</b><span>X :</span><b>960</b><span>V :</span><b>255</b><span>Y :</span><b>540</b><span>B :</span><b>255</b><span></span><b></b><span>A :</span><b>255</b></div></div>
        <div class="ae-acc"><div class="ae-acch">Audio</div></div>
        <div class="ae-acc"><div class="ae-acch on">Aperçu</div><div class="ae-accb ae-prev"><button data-t="start">${G.skipb}</button><button data-t="back">${G.rew}</button><button data-t="play" class="ae-pbtn">${G.play}</button><button data-t="fwd">${G.ff}</button><button data-t="end">${G.skipf}</button></div></div>
        <div class="ae-acc grow"><div class="ae-acch on">Effets et paramètres prédéfinis</div><div class="ae-accb ae-fx"><label class="ae-search">${G.search}<input aria-label="Rechercher un effet"></label>${['Paramètres prédéfinis d\'animation', 'Audio', 'Bruit et grain', 'Correction colorimétrique', 'Couche', 'Déformation', 'Esthétiques', 'Flou et netteté', 'Générer', 'Perspective', 'Simulation', 'Texte', 'Transition', 'Utilitaires'].map(x => `<div>${G.fwd}${x}</div>`).join('')}</div></div>
        <div class="ae-acc"><div class="ae-acch">Aligner</div></div>
        <div class="ae-acc"><div class="ae-acch">Bibliothèques</div></div>
        <div class="ae-acc"><div class="ae-acch">Caractère</div></div>
        <div class="ae-acc"><div class="ae-acch">Paragraphe</div></div>
      </section>
    </div>
    <section class="ae-pnl ae-tl">
      <div class="ae-tabs"><span class="on" data-tab="tl">${AEI.comp}<b class="ae-cn3"></b> ≡</span><span data-tab="rq">File d'attente de rendu</span></div>
      <div class="ae-tlbody"></div>
      <div class="ae-rq hidden"><div class="ae-rqh"><b>Rendu en cours actuel</b><button class="ae-rbtn" data-a="render">Rendu</button></div><div class="ae-rqrow hd"><span>Rendu</span><span>Nom de la composition</span><span>État</span></div><div class="ae-rqrow"><span>☑</span><span class="ae-rqn"></span><span class="ae-rqs">En file d'attente</span></div><p class="ae-rqo">Module de sortie : <u>H.264 — Débit élevé</u> · Destination : <u class="ae-rqf"></u></p></div>
    </section>
    <div class="render-card hidden"></div>
  </div>`;

  const root = $('.ae', body);
  const st = { p: null, T: null };
  rec.state = st;
  const playBtns = $$('.ae-pbtn, .ae-cplay', body), tcs = $$('.ae-tc, .ae-ctc', body);

  function timelineHTML(p, d) {
    if (p.timeline) return captureHTML(p, 'ae-cap');
    const Ls = aeLayers(p, d), P = x => (x / d * 100).toFixed(3);
    return `<div class="ae-gen">
      <div class="ae-left">
        <div class="ae-lh"><span class="ae-tc mono">0:00:00:00</span><span class="ae-fr mono">00000 (25.00 i/s)</span><label class="ae-ls">${G.search}<input aria-label="Rechercher un calque"></label></div>
        <div class="ae-cols"><span class="c-av">${AEI.eye}${AEI.spk}</span><span class="c-lbl"></span><span class="c-num">#</span><span class="c-name">Nom de la source</span><span class="c-sw">✱ ⁄ fx</span><span class="c-mode">Mode</span><span class="c-par">Parent et lien</span></div>
        ${Ls.map((l, i) => `<div class="ae-ly"><span class="c-av">${l.ic === 'audio' ? AEI.spk : AEI.eye}</span><i class="c-lbl" style="background:${l.c}"></i><span class="c-num">${i + 1}</span><span class="c-name"><i class="c-ic">${AEI[l.ic]}</i>${esc(l.n)}</span><span class="c-sw">${l.ic === 'lyAdj' ? '◐' : '⁄'}</span><span class="c-mode">${l.mode ? `${l.mode} ${G.down}` : ''}</span><span class="c-par">⊚ Aucun ${G.down}</span></div>`).join('')}
      </div>
      <div class="ae-rgt">
        <div class="ae-ruler"><i class="ae-wa"></i>${rulerMarks(d, s => s >= 60 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : `${pad(s)}s`)}</div>
        ${Ls.map(l => `<div class="ae-lr"><i class="ae-bar" style="left:${P(l.s)}%;width:${P(l.e - l.s)}%;--c:${l.c}"></i>${l.keys.map(k => `<i class="ae-kf" style="left:${P(k)}%"></i>`).join('')}</div>`).join('')}
        <div class="ae-cti"><i></i></div>
      </div></div>`;
  }
  function load(p) {
    if (!p) return;
    if (st.T) st.T.destroy();
    st.p = p;
    const d0 = durSec(p.duration) || 30;
    rec.setTitle(`Adobe After Effects ${new Date().getFullYear()} - ${slug(p.short)}.aep`);
    $$('.ae-cn, .ae-cn2, .ae-cn3, .ae-rqn', body).forEach(e => { e.textContent = p.short; });
    $('.ae-rqf', body).textContent = `${slug(p.short)}.mp4`;
    $('.ae-pn', body).textContent = p.short;
    $('.ae-pd', body).textContent = `Δ ${aeTC(d0)}, 25,00 i/s`;
    $('.ae-pth', body).innerHTML = poster(p, { label: false });
    $$('.ae-prow.comp', body).forEach(r => r.classList.toggle('on', r.dataset.id === p.id));
    $('.ae-frame', body).innerHTML = (isVideoFile(p.video) || embedURL(p.video)) ? viewerMediaHTML(p) : compArtHTML(p);
    $('.ae-tlbody', body).innerHTML = timelineHTML(p, d0);
    const ca = $('.ca', body);
    st.T = createTransport(root, p, {
      loop: true,
      onTick: (t, d) => {
        const s = aeTC(t); $$('.ae-tc, .ae-ctc', body).forEach(e => { e.textContent = s; });
        const fr = $('.ae-fr', body); if (fr) fr.textContent = `${String(Math.floor(t * 25)).padStart(5, '0')} (25.00 i/s)`;
        const cti = $('.ae-cti', body); if (cti) cti.style.left = (t / d * 100).toFixed(3) + '%';
        if (ca) ca.style.setProperty('--t', `-${(t % 6).toFixed(3)}s`);
      },
      onState: on => { playBtns.forEach(b => { b.innerHTML = on ? G.pause : G.play; }); }
    });
    const v = $('video.vx', body);
    if (v) v.addEventListener('loadedmetadata', () => { $('.ae-pd', body).textContent = `Δ ${aeTC(st.T.dur())}, 25,00 i/s`; if (!p.timeline) { $('.ae-tlbody', body).innerHTML = timelineHTML(p, st.T.dur()); wireTL(); } }, { once: true });
    wireTL();
    if (!v && !st.T.external) st.T.play();
  }
  function wireTL() {
    const lane = $('.ae-rgt', body); if (!lane) return;
    lane.addEventListener('pointerdown', e => {
      const r = lane.getBoundingClientRect();
      const go = ev => st.T.seek(clamp((ev.clientX - r.left) / r.width, 0, 1) * st.T.dur());
      go(e); lane.setPointerCapture(e.pointerId);
      const up = () => { lane.removeEventListener('pointermove', go); lane.removeEventListener('pointerup', up); };
      lane.addEventListener('pointermove', go); lane.addEventListener('pointerup', up);
    });
  }
  st.load = load;
  const ctl = e => {
    const b = e.target.closest('[data-t]'); if (!b || !st.T) return; const T = st.T, k = b.dataset.t;
    if (k === 'play') T.toggle(); else if (k === 'start') T.seek(0); else if (k === 'end') T.seek(T.dur());
    else if (k === 'back') T.step(-1 / 25); else if (k === 'fwd') T.step(1 / 25);
  };
  $('.ae-prev', body).addEventListener('click', ctl);
  $('.ae-cplay', body).addEventListener('click', () => st.T && st.T.toggle());
  $('.ae-stage', body).addEventListener('click', e => { if (!e.target.closest('iframe') && st.T) st.T.toggle(); });
  $('.ae-ptable', body).addEventListener('click', e => { const r = e.target.closest('.ae-prow.comp'); if (r) load(byId(r.dataset.id)); });
  $('.ae-toolbar', body).addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b && b.dataset.tool !== 'home') $$('[data-tool]', body).forEach(x => x.classList.toggle('on', x === b)); });
  $('.ae-ws', body).addEventListener('click', e => { const b = e.target.closest('b'); if (b) $$('.ae-ws b', body).forEach(x => x.classList.toggle('on', x === b)); });
  $('.ae-right', body).addEventListener('click', e => { const hd = e.target.closest('.ae-acch'); if (hd) hd.classList.toggle('on'); });
  $('.ae-tl .ae-tabs', body).addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (!t) return;
    $$('.ae-tl .ae-tabs span', body).forEach(x => x.classList.toggle('on', x === t));
    $('.ae-tlbody', body).classList.toggle('hidden', t.dataset.tab !== 'tl'); $('.ae-rq', body).classList.toggle('hidden', t.dataset.tab !== 'rq');
  });
  $('[data-a="render"]', body).addEventListener('click', () => {
    $('.ae-rqs', body).textContent = 'Rendu…';
    startRender(rec, { file: `${slug(st.p.short)}.mp4`, frames: Math.round(st.T.dur() * 25), app: 'ae', onDone: () => { $('.ae-rqs', body).textContent = 'Terminé'; } });
  });
  rec.onkey = e => {
    if (!st.T) return;
    if (e.key === ' ') { e.preventDefault(); st.T.toggle(); }
    else if (e.key === 'PageDown' || e.key === 'ArrowRight') { e.preventDefault(); st.T.step(1 / 25); }
    else if (e.key === 'PageUp' || e.key === 'ArrowLeft') { e.preventDefault(); st.T.step(-1 / 25); }
    else if (e.key === 'Home') st.T.seek(0);
  };
  rec.onhide = () => st.T && st.T.pause();
  rec.onclose = () => { if (st.T) st.T.destroy(); clearInterval(rec.renderTimer); };
  load(first);
}

/* ==================================================================
   LIGHTROOM CLASSIC — module Développement (photos)
   ================================================================== */
const LRI = {
  crop: si('<path d="M6.5 2.5v14a1 1 0 0 0 1 1h14M2.5 6.5h14a1 1 0 0 1 1 1v14"/><path d="M10 14l7-7" stroke-dasharray="2 2"/>'),
  heal: si('<rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M11 11h2M12 10v2"/>'),
  redeye: si('<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>'),
  mask: si('<circle cx="12" cy="12" r="8" stroke-dasharray="3 2.4"/><circle cx="12" cy="12" r="3.5"/>'),
  coll: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="4" y="2" width="8" height="1.2" fill="currentColor"/></svg>',
  drop: si('<path d="M5 19l1-4 8.5-8.5 3 3L9 18z"/><path d="M15 4.5l4.5 4.5"/>'),
  grid: si('<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>'),
  loupe: si('<rect x="4" y="5" width="16" height="14" rx="1"/>'),
  ba: '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="16.5" text-anchor="middle" font-family="-apple-system,Inter,sans-serif" font-weight="700" font-size="11" fill="currentColor">Y|Y</text></svg>'
};
const LR_DEF = { temp: 0, tint: 0, exp: 0, con: 0, hi: 0, sh: 0, wh: 0, bl: 0, tex: 0, cla: 0, deh: 0, vib: 0, sat: 0, bw: false };
const LR_GROUPS = [
  ['Bal. blancs', [['temp', 'Temp.', -100, 100, 1, 'g-temp'], ['tint', 'Teinte', -100, 100, 1, 'g-tint']]],
  ['Ton', [['exp', 'Exposition', -5, 5, 0.05, ''], ['con', 'Contraste', -100, 100, 1, ''], ['hi', 'Hautes lumières', -100, 100, 1, ''], ['sh', 'Ombres', -100, 100, 1, ''], ['wh', 'Blancs', -100, 100, 1, ''], ['bl', 'Noirs', -100, 100, 1, '']]],
  ['Présence', [['tex', 'Texture', -100, 100, 1, ''], ['cla', 'Clarté', -100, 100, 1, ''], ['deh', 'Correction du voile', -100, 100, 1, ''], ['vib', 'Vibrance', -100, 100, 1, 'g-sat'], ['sat', 'Saturation', -100, 100, 1, 'g-sat']]]
];
const LR_LABEL = Object.fromEntries(LR_GROUPS.flatMap(g => g[1].map(s => [s[0], s[1]])));
const LR_PRESETS = [
  ['Couleur', [['Couleur vive', { vib: 35, sat: 8, con: 18, cla: 10 }], ['Lumineux et doux', { exp: 0.3, con: -18, hi: -35, sh: 30, cla: -8 }]]],
  ['Créatif', [['Chaud', { temp: 32, tint: 6, vib: 12 }], ['Froid', { temp: -32, tint: -4, con: 10 }], ['Vintage', { temp: 18, con: -16, sat: -28, bl: 35, deh: -10 }], ['Cinéma', { temp: -10, con: 28, sh: -18, deh: 12, sat: -12 }]]],
  ['Noir et blanc', [['N&B contrasté', { bw: true, con: 42, cla: 22, bl: -20 }], ['N&B doux', { bw: true, con: -12, sh: 25 }]]]
];
const lrList = () => { const l = CONFIG.projects.filter(x => appFor(x) === 'lr'); return l.length ? l : CONFIG.projects.filter(x => x.type === 'photo'); };
const lrImages = p => { const g = asList(p.gallery); return g.length ? g : p.cover ? [p.cover] : [null, null, null, null, null, null]; };
const lrFmt = (k, v) => k === 'exp' ? (v > 0 ? '+' : '') + v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (v > 0 ? '+' : '') + v;
function lrFilter(a) {
  const br = Math.pow(2, a.exp * 0.55) * (1 + a.sh * 0.0012 + a.wh * 0.0018 - a.hi * 0.0008);
  const ct = 1 + a.con / 250 + a.cla / 450 + a.tex / 700 + a.deh / 320 - a.bl / 500;
  const sa = Math.max(0, (1 + a.sat / 100) * (1 + a.vib / 170) * (1 + a.deh / 500));
  return `brightness(${br.toFixed(3)}) contrast(${Math.max(0.2, ct).toFixed(3)}) saturate(${a.bw ? 0 : sa.toFixed(3)})`;
}
function lrHisto(seed, a) {
  const r = rng(seed); const ch = a.bw ? [['#bbbbbb', 0.48]] : [['#ff453a', 0.34], ['#30d158', 0.5], ['#0a84ff', 0.64]];
  const shift = a.exp * 0.07 + a.sh * 0.0008 + a.wh * 0.001, spread = 1 + a.con / 220 + a.cla / 500;
  return `<svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">${ch.map(([c, mu]) => {
    let d = 'M0 40'; const m = clamp(mu + shift + (r() - 0.5) * 0.12, 0.05, 0.95), s = (0.13 + r() * 0.06) * spread;
    for (let i = 0; i <= 50; i++) { const x = i / 50; const v = Math.exp(-((x - m) ** 2) / (2 * s * s)) * (0.72 + r() * 0.28) + r() * 0.06; d += `L${x * 100} ${(40 - v * 34).toFixed(1)}`; }
    return `<path d="${d}L100 40Z" fill="${c}" fill-opacity=".5"/>`;
  }).join('')}</svg>`;
}

function openLR(p, from) {
  const list = lrList();
  p = p || list[0];
  const ex = WM.list.get('app-lr');
  if (ex) { if (ex.minimized) WM.restore(ex.id); else WM.focus(ex.id); ex.state.load(p); return; }
  WM.open('app-lr', { app: 'lr', kind: 'lr', title: 'Catalogue Lightroom.lrcat - Adobe Photoshop Lightroom Classic - Développement', w: 1260, h: 790, cls: 'win-dark win-pro win-lr', minW: 720, from, build: (body, rec) => buildLR(body, rec, p) });
}
function buildLR(body, rec, first) {
  const list = lrList();
  const slider = ([k, l, min, max, step, g]) => `<div class="lr-sl" data-k="${k}"><span class="lr-sll" title="Double-clic pour réinitialiser">${l}</span><input type="range" class="${g}" min="${min}" max="${max}" step="${step}" value="0" data-k="${k}" aria-label="${l}"><em class="mono" data-v="${k}">${lrFmt(k, 0)}</em></div>`;
  body.innerHTML = `<div class="lr">
    <header class="lr-top">
      <div class="lr-id"><span class="lr-logo">${icon('lrc')}</span><span><small>Adobe</small><b>Lightroom Classic</b></span></div>
      <nav class="lr-mods">${['Bibliothèque', 'Développement', 'Cartes', 'Livres', 'Diaporama', 'Impression', 'Web'].map((m, i) => `${i ? '<i>|</i>' : ''}<b class="${m === 'Développement' ? 'on' : ''}">${m}</b>`).join('')}</nav>
    </header>
    <div class="lr-main">
      <aside class="lr-left">
        <section class="lr-p"><h4>Navigation <span class="hide-s">ADAPTER&nbsp;&nbsp;REMPL.&nbsp;&nbsp;100%&nbsp;&nbsp;200%</span></h4><div class="lr-nav"></div></section>
        <section class="lr-p"><h4>Paramètres prédéfinis <span>+</span></h4><div class="lr-presets">${LR_PRESETS.map(([g, items]) => `<div class="lr-pg">${G.down}${g}</div>${items.map(([n]) => `<button class="lr-pi" data-preset="${esc(n)}">${esc(n)}</button>`).join('')}`).join('')}</div></section>
        <section class="lr-p"><h4>Historique <span>×</span></h4><div class="lr-hist"></div></section>
        <section class="lr-p"><h4>Collections <span>+</span></h4><div class="lr-cols">${list.map(p => `<button class="lr-col" data-id="${p.id}">${LRI.coll}<span>${esc(p.short)}</span><em>${lrImages(p).length}</em></button>`).join('')}</div></section>
        <section class="lr-p grow"><h4>Commentaires</h4><div class="lr-cmt"></div></section>
        <div class="lr-lbtns"><button data-a="copy">Copier…</button><button data-a="paste">Coller</button></div>
      </aside>
      <section class="lr-center">
        <div class="lr-stage">
          <div class="lr-half lr-before"><div class="lr-img"></div><span class="lr-tag">Avant</span></div>
          <div class="lr-half lr-after"><div class="lr-img"><div class="lr-pic"></div><i class="lr-warm"></i><i class="lr-tint"></i></div><span class="lr-tag">Après</span></div>
          <div class="lr-info"><b class="lr-fn"></b><span class="lr-sub"></span></div>
        </div>
        <div class="lr-toolbar"><button data-v="loupe" class="on" aria-label="Loupe">${LRI.loupe}</button><button data-v="ba" aria-label="Avant/Après">${LRI.ba}</button><span class="lr-tbl hide-s">Avant/Après</span><span class="lr-sp"></span><span class="lr-ck hide-s"><i></i>Épreuvage écran</span></div>
      </section>
      <aside class="lr-right">
        <section class="lr-p"><h4>Histogramme</h4><div class="lr-histo"></div><div class="lr-exif mono"><span>ISO 200</span><span>35 mm</span><span>f/2,8</span><span>1/250 s</span></div></section>
        <div class="lr-tools">${['crop', 'heal', 'redeye', 'mask'].map(k => `<span>${LRI[k]}</span>`).join('')}</div>
        <div class="lr-rscroll">
          <section class="lr-p lr-basic"><h4>Réglages de base</h4>
            <div class="lr-treat"><span>Traitement :</span><b data-bw="0" class="on">Couleur</b><b data-bw="1">Noir et blanc</b></div>
            <div class="lr-row"><span>Profil :</span><b>Couleur Adobe ${G.down}</b>${LRI.grid}</div>
            ${LR_GROUPS.map(([g, sls], gi) => `${gi === 0 ? `<div class="lr-row"><span>Bal. blancs :</span>${LRI.drop}<b>Tel quel ${G.down}</b></div>` : `<div class="lr-gh">${g}${gi === 1 ? '<span data-a="auto">Auto</span>' : ''}</div>`}${sls.map(slider).join('')}`).join('')}
          </section>
          ${['Courbe des tonalités', 'Mélangeur de couleurs', 'Étalonnage des couleurs', 'Détail', 'Corrections de l\'objectif', 'Transformation', 'Effets', 'Étalonnage'].map(t => `<section class="lr-p closed"><h4>${t}</h4></section>`).join('')}
        </div>
        <div class="lr-rbtns"><button data-a="prev">Précédent</button><button data-a="reset">Réinitialiser</button></div>
      </aside>
    </div>
    <div class="lr-film">
      <div class="lr-fbar"><span class="lr-fb">1</span><span class="lr-fb">2</span><span class="lr-fb">${LRI.grid}</span><span class="lr-fpath"></span><span class="lr-sp"></span><span class="hide-s">Filtre : <b>Filtres désactivés ${G.down}</b></span></div>
      <div class="lr-strip"></div>
    </div>
  </div>`;
  const st = { p: null, i: 0, a: { ...LR_DEF }, saved: {}, hist: [], view: 'loupe', nat: null, clip: null, last: null };
  rec.state = st;
  const root = $('.lr', body), stage = $('.lr-stage', body), pic = $('.lr-after .lr-pic', body), beforeImg = $('.lr-before .lr-img', body);
  const warm = $('.lr-warm', body), tint = $('.lr-tint', body);
  const key = () => `${st.p.id}:${st.i}`;
  const media = (src, i) => src ? `<img src="${esc(src)}" alt="${esc(st.p.title)} — photo ${i + 1}" draggable="false">` : poster(st.p, { label: i === 0, hue: i * 24 });
  let raf = 0;
  function apply() {
    raf = 0; const a = st.a;
    pic.style.filter = lrFilter(a);
    warm.style.background = a.temp >= 0 ? '#ff9b3d' : '#3d8bff'; warm.style.opacity = a.bw ? 0 : (Math.abs(a.temp) / 170).toFixed(3);
    tint.style.background = a.tint >= 0 ? '#ff3dc8' : '#3dff6b'; tint.style.opacity = a.bw ? 0 : (Math.abs(a.tint) / 220).toFixed(3);
    $('.lr-histo', body).innerHTML = lrHisto(key(), a);
    $$('.lr-treat b', body).forEach(b => b.classList.toggle('on', (b.dataset.bw === '1') === a.bw));
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
  function syncSliders() {
    $$('.lr-sl input', body).forEach(inp => { inp.value = st.a[inp.dataset.k]; $(`[data-v="${inp.dataset.k}"]`, body).textContent = lrFmt(inp.dataset.k, st.a[inp.dataset.k]); });
  }
  function renderHist() {
    $('.lr-hist', body).innerHTML = [...st.hist].reverse().map((h, k) => `<div class="${k === 0 ? 'on' : ''}">${esc(h)}</div>`).join('') + `<div>Importer (${new Date().toLocaleDateString('fr-FR')})</div>`;
  }
  const pushHist = label => { if (st.hist[st.hist.length - 1] === label) return; st.hist.push(label); if (st.hist.length > 12) st.hist.shift(); st.saved[key()] = { a: { ...st.a }, hist: st.hist.slice() }; renderHist(); };
  function fit() {
    const W = stage.clientWidth - 40, H = stage.clientHeight - 40; if (W <= 0 || H <= 0) return;
    const ar = st.nat ? st.nat.w / st.nat.h : 3 / 2;
    const ba = st.view === 'ba', bw = ba ? (W - 12) / 2 : W;
    let w = bw, hh = w / ar; if (hh > H) { hh = H; w = hh * ar; }
    $$('.lr-img', body).forEach(el => { el.style.width = Math.round(w) + 'px'; el.style.height = Math.round(hh) + 'px'; });
  }
  function show(i) {
    const p = st.p, imgs = lrImages(p);
    if (st.p && st.i !== undefined) st.saved[key()] = { a: { ...st.a }, hist: st.hist.slice() };
    st.last = { ...st.a };
    st.i = (i + imgs.length) % imgs.length; st.nat = null;
    const sv = st.saved[key()] || { a: { ...LR_DEF }, hist: [] };
    st.a = { ...sv.a }; st.hist = sv.hist.slice();
    const src = imgs[st.i], bsrc = asList(p.before)[st.i];
    pic.innerHTML = media(src, st.i);
    beforeImg.innerHTML = bsrc ? `<img src="${esc(bsrc)}" alt="Avant retouche" draggable="false">` : media(src, st.i);
    beforeImg.classList.toggle('flat', !bsrc);
    $('.lr-nav', body).innerHTML = media(src, st.i);
    const fn = `${slug(p.short)}_${String(st.i + 1).padStart(4, '0')}.${src ? (src.split('.').pop().split(/[?#]/)[0] || 'jpg').toLowerCase() : 'cr3'}`;
    $('.lr-fn', body).textContent = fn;
    $('.lr-sub', body).textContent = `${p.title} — ${p.client} · ${p.year}`;
    $('.lr-fpath', body).innerHTML = `Collection : <b>${esc(p.short)}</b>&nbsp;&nbsp;${imgs.length} photo${imgs.length > 1 ? 's' : ''} / 1 sélectionnée / ${esc(fn)}`;
    $$('.lr-th', body).forEach((t, k) => t.classList.toggle('on', k === st.i));
    const img = $('img', pic);
    if (img) { const done = () => { if (img.naturalWidth) st.nat = { w: img.naturalWidth, h: img.naturalHeight }; fit(); }; if (img.complete) done(); else img.addEventListener('load', done, { once: true }); }
    $$('.lr-pi', body).forEach(x => x.classList.remove('on'));
    syncSliders(); renderHist(); apply(); fit();
  }
  function load(p) {
    if (!p) return;
    st.p = p; st.i = undefined;
    rec.setTitle('Catalogue Lightroom.lrcat - Adobe Photoshop Lightroom Classic - Développement');
    $$('.lr-col', body).forEach(c => c.classList.toggle('on', c.dataset.id === p.id));
    $('.lr-cmt', body).innerHTML = `<b>${esc(p.title)}</b><small>${esc(p.client)} · ${esc(p.year)} · ${esc(p.role)}</small><p>${esc(p.description)}</p><div class="lr-tags">${(p.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>${asList(p.before).length ? '<p class="lr-tip">Astuce : bouton Y|Y (ou touche Y) pour comparer avant / après.</p>' : '<p class="lr-tip">Astuce : bouges les curseurs, essaie un paramètre prédéfini, puis Y|Y pour comparer.</p>'}`;
    const imgs = lrImages(p);
    $('.lr-strip', body).innerHTML = imgs.map((src, k) => `<button class="lr-th" data-i="${k}" aria-label="Photo ${k + 1}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : poster(p, { label: false, hue: k * 24 })}<span class="mono">${k + 1}</span></button>`).join('');
    show(0);
  }
  st.load = load;
  // curseurs
  const right = $('.lr-right', body);
  right.addEventListener('input', e => {
    const inp = e.target.closest('input[data-k]'); if (!inp) return;
    const k = inp.dataset.k; st.a[k] = +inp.value; $(`[data-v="${k}"]`, body).textContent = lrFmt(k, st.a[k]); schedule();
  });
  right.addEventListener('change', e => { const inp = e.target.closest('input[data-k]'); if (inp) pushHist(`${LR_LABEL[inp.dataset.k]} ${lrFmt(inp.dataset.k, st.a[inp.dataset.k])}`); });
  right.addEventListener('dblclick', e => { const l = e.target.closest('.lr-sll'); if (!l) return; const k = l.parentElement.dataset.k; st.a[k] = 0; syncSliders(); schedule(); pushHist(`${LR_LABEL[k]} ${lrFmt(k, 0)}`); });
  right.addEventListener('click', e => {
    const b = e.target.closest('[data-bw]'); if (b) { st.a.bw = b.dataset.bw === '1'; schedule(); pushHist(st.a.bw ? 'Noir et blanc' : 'Couleur'); return; }
    const a = e.target.closest('[data-a]');
    if (a && a.dataset.a === 'auto') { Object.assign(st.a, { exp: 0.25, con: 12, hi: -28, sh: 22, wh: 10, bl: -8, vib: 10 }); syncSliders(); schedule(); pushHist('Ton automatique'); }
    else if (a && a.dataset.a === 'reset') { st.a = { ...LR_DEF }; syncSliders(); schedule(); pushHist('Réinitialiser'); }
    else if (a && a.dataset.a === 'prev' && st.last) { st.a = { ...st.last }; syncSliders(); schedule(); pushHist('Coller les paramètres (Précédent)'); }
    const hd = e.target.closest('.lr-p > h4'); if (hd) hd.parentElement.classList.toggle('closed');
  });
  // panneau de gauche
  $('.lr-left', body).addEventListener('click', e => {
    const pr = e.target.closest('[data-preset]');
    if (pr) { const found = LR_PRESETS.flatMap(g => g[1]).find(x => x[0] === pr.dataset.preset); st.a = { ...LR_DEF, ...found[1] }; syncSliders(); schedule(); pushHist(`Paramètre prédéfini : ${found[0]}`); $$('.lr-pi', body).forEach(x => x.classList.toggle('on', x === pr)); return; }
    const c = e.target.closest('.lr-col'); if (c) { load(byId(c.dataset.id)); return; }
    const a = e.target.closest('[data-a]');
    if (a && a.dataset.a === 'copy') { st.clip = { ...st.a }; notify({ title: 'Paramètres copiés', body: 'Sélectionne une autre photo puis clique sur Coller.', ic: 'lrc', app: 'Lightroom Classic', time: 3000 }); }
    else if (a && a.dataset.a === 'paste' && st.clip) { st.a = { ...st.clip }; syncSliders(); schedule(); pushHist('Coller les paramètres'); }
    const hd = e.target.closest('.lr-p > h4'); if (hd) hd.parentElement.classList.toggle('closed');
  });
  // vues
  const setView = v => { st.view = v; root.classList.toggle('ba', v === 'ba'); $$('.lr-toolbar [data-v]', body).forEach(x => x.classList.toggle('on', x.dataset.v === v)); fit(); };
  $('.lr-toolbar', body).addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) setView(b.dataset.v); });
  $('.lr-strip', body).addEventListener('click', e => { const t = e.target.closest('.lr-th'); if (t) show(+t.dataset.i); });
  $('.lr-mods', body).addEventListener('click', e => { const b = e.target.closest('b'); if (b && !b.classList.contains('on')) notify({ title: `Module ${b.textContent}`, body: 'Ce portfolio montre le module Développement.', ic: 'lrc', app: 'Lightroom Classic', time: 2500 }); });
  rec.onkey = e => {
    if (e.key === 'ArrowRight') show(st.i + 1);
    else if (e.key === 'ArrowLeft') show(st.i - 1);
    else if (e.key.toLowerCase() === 'y') setView(st.view === 'ba' ? 'loupe' : 'ba');
    else if (e.key === '\\') root.classList.toggle('show-before');
  };
  const ro = new ResizeObserver(() => fit()); ro.observe(stage);
  rec.onclose = () => ro.disconnect();
  load(first);
}

/* ==================================================================
   PHOTOSHOP (interface réelle)
   ================================================================== */
const PSI = {
  move: si('<path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>'),
  artboard: si('<rect x="6" y="6" width="12" height="12"/><path d="M6 3v3M18 3v3M6 18v3M18 18v3M3 6h3M3 18h3M18 6h3M18 18h3"/>'),
  marquee: si('<rect x="4.5" y="5.5" width="15" height="13" stroke-dasharray="2.5 2"/>'),
  lasso: si('<path d="M7 17c-3-1.5-4-4-2.5-7C6.5 6 13 4.5 17.5 6.5s3.5 7.5-2 9.5c-3 1-6 .8-8.5 1z"/><path d="M7 17c-.5 1.5.2 3 2 3"/>'),
  objsel: si('<rect x="4" y="4" width="11" height="11" stroke-dasharray="2.5 2"/><path d="M12 11l8 4-3.5 1 2.5 4-1.5 1-2.5-4-2.5 2.5z" fill="currentColor"/>'),
  crop: si('<path d="M6.5 2.5v14a1 1 0 0 0 1 1h14M2.5 6.5h14a1 1 0 0 1 1 1v14"/>'),
  frame: si('<rect x="4" y="4" width="16" height="16"/><path d="M4 4l16 16M20 4L4 20"/>'),
  eyedrop: si('<path d="M5 19l1-4 8.5-8.5 3 3L9 18z"/><path d="M15 4.5l4.5 4.5"/>'),
  heal: si('<rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M11 11h2M12 10v2"/>'),
  brush: si('<path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M6.5 12.5c-2 .5-3 2.5-3 4.5 0 1.5-.5 2.5-1.5 3 3 0 7-1 8-3.5"/>'),
  stamp: si('<path d="M9 4h6v5l3 3H6l3-3z"/><path d="M6 14h12v3H6zM8 17v3h8v-3"/>'),
  history: si('<path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M4 18a3 3 0 0 0 4 2"/>'),
  eraser: si('<path d="M4 15l8-9 8 8-6 6H8z"/><path d="M9 10l7 7"/>'),
  gradient: si('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 20L20 4" stroke-dasharray="2 2"/>'),
  blur: si('<path d="M12 3c3 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6.5 6-11z"/>'),
  dodge: si('<circle cx="9" cy="9" r="5"/><path d="M12.5 12.5l7 7"/>'),
  pen: si('<path d="M12 3l6 10-6 7-6-7z"/><circle cx="12" cy="12" r="1.5"/>'),
  type: '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="18" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="currentColor">T</text></svg>',
  path: si('<path d="M6 4l11 7.5-5 1 3 6-2 1-3-6-4 3.5z"/>'),
  shape: si('<rect x="4.5" y="5.5" width="15" height="13" rx="1"/>'),
  hand: si('<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V13M8 12V9.5a1.5 1.5 0 0 0-3 0V14c0 4 2.5 6.5 6.5 6.5S17 18 17 14v-1"/>'),
  zoom: si('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/>'),
  adj: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>',
  curves: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1"/><path d="M2 14C6 13 8 4 14 2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  hue: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="5" width="13" height="6" rx="1" fill="url(#psHue)"/></svg>',
  link: si('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  fx: '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="16.5" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="13" fill="currentColor">fx</text></svg>',
  mask: si('<rect x="4" y="5" width="16" height="14" rx="1.5"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>'),
  group: si('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
  newl: si('<rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M12 9v6M9 12h6"/>'),
  ws: si('<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M14 5v14"/>')
};
const psList = () => { const l = CONFIG.projects.filter(x => appFor(x) === 'ps'); return l.length ? l : CONFIG.projects.filter(x => x.type === 'design').slice(0, 2); };
const psPoster = p => p.type !== 'photo';
const psImages = p => { const g = asList(p.gallery); return g.length ? g : p.cover ? [p.cover] : psPoster(p) ? [null] : [null, null, null, null]; };

function openPS(p, from) {
  const list = psList();
  p = p || list[0];
  const ex = WM.list.get('app-ps');
  if (ex) { if (ex.minimized) WM.restore(ex.id); else WM.focus(ex.id); ex.state.load(p); return; }
  WM.open('app-ps', { app: 'ps', kind: 'ps', title: 'Adobe Photoshop', w: 1260, h: 780, chrome: 'none', cls: 'win-dark win-pro win-ps', minW: 720, from, build: (body, rec) => buildPS(body, rec, p) });
}
function buildPS(body, rec, first) {
  const list = psList();
  const TOOLS = ['move', 'artboard', 'marquee', 'lasso', 'objsel', 'crop', 'frame', 'eyedrop', 'heal', 'brush', 'stamp', 'history', 'eraser', 'gradient', 'blur', 'dodge', 'pen', 'type', 'path', 'shape', 'hand', 'zoom'];
  const TNAMES = { move: 'Déplacement', artboard: 'Plan de travail', marquee: 'Rectangle de sélection', lasso: 'Lasso', objsel: 'Sélection d\'objet', crop: 'Recadrage', frame: 'Cadre', eyedrop: 'Pipette', heal: 'Correcteur localisé', brush: 'Pinceau', stamp: 'Tampon de duplication', history: 'Forme d\'historique', eraser: 'Gomme', gradient: 'Dégradé', blur: 'Goutte d\'eau', dodge: 'Densité -', pen: 'Plume', type: 'Texte horizontal', path: 'Sélection de tracé', shape: 'Rectangle', hand: 'Main', zoom: 'Zoom' };
  body.innerHTML = `<div class="ps">
    <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="psHue" x1="0" x2="1"><stop offset="0" stop-color="#f00"/><stop offset=".33" stop-color="#0f0"/><stop offset=".66" stop-color="#00f"/><stop offset="1" stop-color="#f00"/></linearGradient></defs></svg>
    <div class="ps-opts" data-drag>
      <div class="tl-slot"></div>
      <button class="ps-home" aria-label="Accueil">${G.home}</button>
      <span class="ps-tooln">${PSI.move}${G.down}</span>
      <span class="ps-ck"><i class="on">${G.check}</i>Sélection automatique : <b>Calque ${G.down}</b></span>
      <span class="ps-ck hide-s"><i></i>Options de transformation</span>
      <span class="ps-align hide-s">${'<i></i>'.repeat(6)}</span>
      <span class="ps-sp"></span>
      <span class="ps-3d hide-s">Mode 3D :</span>
      <button class="ps-ico" aria-label="Rechercher">${G.search}</button><button class="ps-ico" aria-label="Espace de travail">${PSI.ws}</button>
      <button class="ps-share" data-a="info">${G.share}Partager</button>
    </div>
    <div class="ps-main">
      <aside class="ps-tools">${TOOLS.map((k, i) => `<button class="${i === 0 ? 'on' : ''}" data-tool="${k}" title="${TNAMES[k]}" aria-label="${TNAMES[k]}">${PSI[k]}</button>`).join('')}<span class="ps-more">${G.more}</span><div class="ps-fgbg"><i></i><i></i></div><button class="ps-qm" aria-label="Masque">${PSI.mask}</button></aside>
      <section class="ps-doc">
        <div class="ps-tabs">${list.map(p => `<button class="ps-tab" data-id="${p.id}"><span></span><i>${G.close}</i></button>`).join('')}</div>
        <div class="ps-canvas">
          <div class="ps-art"><div class="ps-layer ps-bgl"></div><div class="ps-layer ps-before"></div><div class="ps-layer ps-after"></div></div>
          <div class="ps-ctx"><button data-g="-1" aria-label="Image précédente">${G.back}</button><span class="ps-gn mono">1 / 1</span><button data-g="1" aria-label="Image suivante">${G.fwd}</button><i></i><button class="ps-cb">${PSI.objsel}Sélectionner le sujet</button><button class="ps-cb hide-s">${PSI.eraser}Supprimer l'arrière-plan</button><button class="ps-cb">${G.more}</button></div>
        </div>
        <div class="ps-status mono"></div>
      </section>
      <div class="ps-icol">${['history', 'brush', 'type'].map(k => `<span>${PSI[k]}</span>`).join('')}</div>
      <aside class="ps-panels">
        <div class="ps-pg ps-color"><div class="ps-ptabs"><b class="on">Couleur</b><b>Nuancier</b><b>Dégradés</b><b>Motifs</b></div>
          <div class="ps-picker"><div class="ps-sv"><i></i></div><div class="ps-hueb"><i></i></div></div></div>
        <div class="ps-pg ps-props"><div class="ps-ptabs"><b class="on" data-pt="props">Propriétés</b><b data-pt="adj">Réglages</b><b>Bibliothèques</b></div><div class="ps-pbody"></div></div>
        <div class="ps-pg ps-layers grow"><div class="ps-ptabs"><b class="on">Calques</b><b>Couches</b><b>Tracés</b></div>
          <div class="ps-lrow1"><span class="ps-kind">${G.search}Type ${G.down}</span><span class="ps-mini">${'<i></i>'.repeat(5)}</span></div>
          <div class="ps-lrow2"><span class="ps-dd">Normal ${G.down}</span><span>Opacité : <b class="ps-dd">100 % ${G.down}</b></span></div>
          <div class="ps-lrow2"><span>Verrou : <i class="ps-locks">${'<i></i>'.repeat(5)}</i></span><span>Fond : <b class="ps-dd">100 % ${G.down}</b></span></div>
          <div class="ps-llist"></div>
          <div class="ps-lfoot">${[PSI.link, PSI.fx, PSI.mask, PSI.adj, PSI.group, PSI.newl, G.trash].map(x => `<span>${x}</span>`).join('')}</div>
        </div>
      </aside>
    </div>
  </div>`;
  const st = { p: null, i: 0, adj: { exp: 0, con: 0, sat: 0 }, layers: { curves: true, retouch: true, bg: true }, pt: 'props', nat: null };
  rec.state = st;
  const art = $('.ps-art', body), after = $('.ps-after', body), before = $('.ps-before', body), bgl = $('.ps-bgl', body), canvas = $('.ps-canvas', body);
  const layerImg = (src, p, i) => src ? `<img src="${esc(src)}" alt="${esc(p.title)} — ${i + 1}" draggable="false">` : poster(p, { label: true, hue: i * 28 });
  const freshLayers = p => psPoster(p) ? { curves: true, title: true, art: true, bg: true } : { curves: true, retouch: true, bg: true };

  function apply() {
    const a = st.adj, L = st.layers, hasBefore = !!asList(st.p.before)[st.i];
    const f = L.curves ? `brightness(${1 + a.exp / 120}) contrast(${1 + a.con / 110}) saturate(${1 + a.sat / 60})` : '';
    if (psPoster(st.p)) {
      after.style.filter = f || 'none'; after.style.opacity = L.art ? 1 : 0;
      after.classList.toggle('no-title', L.title === false);
      bgl.style.opacity = L.bg ? 1 : 0; before.style.opacity = 0;
      return;
    }
    bgl.style.opacity = 0;
    const flat = hasBefore ? '' : ' grayscale(.25) contrast(.88) brightness(1.06) saturate(.75)';
    after.style.filter = (f + (L.retouch ? '' : flat)).trim() || 'none';
    after.style.opacity = (!L.bg ? 0 : (L.retouch || !hasBefore) ? 1 : 0);
    before.style.opacity = L.bg && !L.retouch && hasBefore ? 1 : 0;
    if (hasBefore) before.style.filter = L.curves && (a.exp || a.con || a.sat) ? f : 'none';
  }
  function fit() {
    const cw = canvas.clientWidth - 60, ch = canvas.clientHeight - 90; if (cw <= 0 || ch <= 0) return;
    const poster = psPoster(st.p), fmt = st.p.format || 'affiche';
    const def = !poster ? [6000, 4000] : { miniature: [1280, 720], post: [1080, 1080], story: [1080, 1920] }[fmt] || [3508, 4961];
    const natW = st.nat ? st.nat.w : def[0], natH = st.nat ? st.nat.h : def[1], ar = natW / natH;
    let w = cw, hh = w / ar; if (hh > ch) { hh = ch; w = hh * ar; }
    art.style.width = Math.round(w) + 'px'; art.style.height = Math.round(hh) + 'px';
    const z = (w / natW * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    const tab = $(`.ps-tab[data-id="${st.p.id}"] span`, body);
    if (tab) tab.textContent = poster ? `${slug(st.p.short)}${st.i ? '_' + pad(st.i + 1) : ''}.psd à ${z} % (Titre, RVB/8)` : `${slug(st.p.short)}_${pad(st.i + 1)}.psd à ${z} % (Retouche, RVB/8)`;
    $('.ps-status', body).textContent = `${z} %   ${natW} px x ${natH} px (300 ppp)   ›`;
  }
  function propsHTML(p) {
    if (st.pt === 'adj') {
      return `<div class="ps-adjh">Ajouter un réglage</div>${[['exp', 'Exposition'], ['con', 'Contraste'], ['sat', 'Saturation']].map(([k, l]) => `<label class="ps-adj"><span>${l}<em class="mono" data-v="${k}">${st.adj[k] > 0 ? '+' : ''}${st.adj[k]}</em></span><input type="range" min="-50" max="50" value="${st.adj[k]}" data-adj="${k}" aria-label="${l}"></label>`).join('')}<button class="ps-reset" data-a="reset">Réinitialiser</button>`;
    }
    return `<div class="ps-ph">${PSI.curves}<b>Document</b></div>
      <div class="ps-pt">${esc(p.title)}</div>
      <dl class="ps-dl"><div><dt>Client</dt><dd>${esc(p.client)}</dd></div><div><dt>Année</dt><dd>${esc(p.year)}</dd></div><div><dt>Rôle</dt><dd>${esc(p.role)}</dd></div><div><dt>Volume</dt><dd>${esc(p.duration)}</dd></div></dl>
      <p class="ps-desc">${esc(p.description)}</p>
      <p class="ps-tip">${psPoster(p) ? (coverOf(p) ? 'Astuce : masque les calques (œil) ou joue avec les Réglages.' : 'Astuce : masque le calque « Titre » ou « Affiche » (œil), ou joue avec les Réglages.') : asList(p.before).length ? 'Astuce : masque le calque « Retouche » (œil) pour voir la photo avant retouche.' : 'Astuce : masque les calques (œil) ou joue avec les Réglages.'}</p>`;
  }
  function layersHTML(p, src) {
    const L = st.layers;
    const row = (k, name, thumb, extra = '') => `<button class="ps-ly ${k === 'retouch' || k === 'title' ? 'sel' : ''} ${L[k] ? '' : 'off'}" data-l="${k}"><span class="ps-eye">${L[k] ? G.eye : ''}</span>${thumb}<b>${name}</b>${extra}</button>`;
    const th = `<span class="ps-lth">${src ? `<img src="${esc(src)}" alt="">` : poster(p, { label: false })}</span>`;
    if (psPoster(p)) return row('curves', 'Courbes 1', `<span class="ps-lth adj">${PSI.curves}</span><span class="ps-lth mask"></span>`) +
      (src ? '' : row('title', (p.short || 'Titre').toUpperCase(), `<span class="ps-lth adj">${PSI.type}</span>`)) +
      row('art', 'Affiche', th) +
      row('bg', 'Arrière-plan', '<span class="ps-lth"></span>', `<i class="ps-lock">${G.lock}</i>`);
    return row('curves', 'Courbes 1', `<span class="ps-lth adj">${PSI.curves}</span><span class="ps-lth mask"></span>`) +
      row('retouch', 'Retouche', th) +
      row('bg', 'Arrière-plan', th, `<i class="ps-lock">${G.lock}</i>`);
  }
  function show(i) {
    const p = st.p, imgs = psImages(p);
    st.i = (i + imgs.length) % imgs.length; st.nat = null;
    const src = imgs[st.i], bsrc = asList(p.before)[st.i];
    after.innerHTML = layerImg(src, p, st.i);
    before.innerHTML = bsrc ? `<img src="${esc(bsrc)}" alt="Avant retouche" draggable="false">` : '';
    $('.ps-gn', body).textContent = `${st.i + 1} / ${imgs.length}`;
    $('.ps-llist', body).innerHTML = layersHTML(p, src);
    const img = $('img', after);
    if (img) { const done = () => { if (img.naturalWidth) st.nat = { w: img.naturalWidth, h: img.naturalHeight }; fit(); }; if (img.complete) done(); else img.addEventListener('load', done, { once: true }); }
    apply(); fit();
    art.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
  }
  function load(p) {
    if (!p) return;
    st.p = p; st.adj = { exp: 0, con: 0, sat: 0 }; st.layers = freshLayers(p);
    rec.setTitle(`Adobe Photoshop — ${p.short}`);
    $$('.ps-tab', body).forEach(t => t.classList.toggle('on', t.dataset.id === p.id));
    $$('.ps-tab span', body).forEach(s => { const q = byId(s.parentElement.dataset.id); s.textContent = psPoster(q) ? `${slug(q.short)}.psd` : `${slug(q.short)}_01.psd`; });
    $('.ps-pbody', body).innerHTML = propsHTML(p);
    show(0);
  }
  st.load = load;
  $('.ps-tabs', body).addEventListener('click', e => {
    const t = e.target.closest('.ps-tab'); if (!t) return;
    if (e.target.closest('i')) { if (t.classList.contains('on')) { const o = $$('.ps-tab', body).find(x => x !== t); if (o) load(byId(o.dataset.id)); } return; }
    load(byId(t.dataset.id));
  });
  $('.ps-ctx', body).addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) show(st.i + Number(b.dataset.g)); });
  $('.ps-llist', body).addEventListener('click', e => {
    const l = e.target.closest('.ps-ly'); if (!l) return; const k = l.dataset.l;
    if (e.target.closest('.ps-eye')) { st.layers[k] = !st.layers[k]; l.classList.toggle('off', !st.layers[k]); $('.ps-eye', l).innerHTML = st.layers[k] ? G.eye : ''; apply(); }
    else { $$('.ps-ly', body).forEach(x => x.classList.toggle('sel', x === l)); }
  });
  $('.ps-props', body).addEventListener('click', e => {
    const t = e.target.closest('[data-pt]'); if (t) { st.pt = t.dataset.pt; $$('.ps-props [data-pt]', body).forEach(x => x.classList.toggle('on', x === t)); $('.ps-pbody', body).innerHTML = propsHTML(st.p); return; }
    if (e.target.closest('[data-a="reset"]')) { st.adj = { exp: 0, con: 0, sat: 0 }; $('.ps-pbody', body).innerHTML = propsHTML(st.p); apply(); }
  });
  $('.ps-props', body).addEventListener('input', e => {
    const inp = e.target.closest('[data-adj]'); if (!inp) return;
    st.adj[inp.dataset.adj] = +inp.value; $(`[data-v="${inp.dataset.adj}"]`, body).textContent = (inp.value > 0 ? '+' : '') + inp.value; apply();
  });
  $('.ps-tools', body).addEventListener('click', e => {
    const b = e.target.closest('[data-tool]'); if (!b) return;
    $$('.ps-tools [data-tool]', body).forEach(x => x.classList.toggle('on', x === b));
    $('.ps-tooln', body).innerHTML = `${PSI[b.dataset.tool]}${G.down}`;
  });
  $('[data-a="info"]', body).addEventListener('click', e => quickLook(st.p, e.currentTarget.getBoundingClientRect()));
  rec.onkey = e => { if (e.key === 'ArrowRight') show(st.i + 1); else if (e.key === 'ArrowLeft') show(st.i - 1); };
  const onRz = () => { if (WM.list.has(rec.id)) fit(); };
  window.addEventListener('winresize', onRz);
  rec.onclose = () => window.removeEventListener('winresize', onRz);
  load(first);
  requestAnimationFrame(fit);
}

/* ==================================================================
   CANVA (éditeur réel)
   ================================================================== */
const CVI = {
  design: si('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><circle cx="16.5" cy="16.5" r="3.5"/>'),
  elements: si('<path d="M12 4l3 5H9z"/><circle cx="7.5" cy="16" r="3.5"/><rect x="13" y="12.5" width="7" height="7" rx="1"/>'),
  text: '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="18" text-anchor="middle" font-family="-apple-system,Inter,sans-serif" font-weight="700" font-size="16" fill="currentColor">T</text></svg>',
  brand: si('<path d="M12 3.5l2.5 5 5.5.8-4 3.9 1 5.5L12 16l-5 2.7 1-5.5-4-3.9 5.5-.8z"/>'),
  upload: si('<path d="M12 16V5M7 9.5l5-5 5 5M5 19.5h14"/>'),
  tools: si('<path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M6.5 12.5c-2 .5-3 2.5-3 4.5 0 1.5-.5 2.5-1.5 3 3 0 7-1 8-3.5"/>'),
  projects: si('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
  apps: si('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><path d="M16.5 13v7M13 16.5h7"/>'),
  resize: si('<path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6"/>'),
  undo: si('<path d="M9 8L4 12l5 4"/><path d="M4 12h10a6 6 0 0 1 0 12"/>'),
  redo: si('<path d="M15 8l5 4-5 4"/><path d="M20 12H10a6 6 0 0 0 0 12"/>'),
  cloud: si('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/><path d="M9.5 13.5l2 2 3.5-3.5"/>'),
  notes: si('<path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  timer: si('<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2.5 2M10 3h4"/>'),
  pages: si('<rect x="4" y="5" width="7" height="14" rx="1"/><rect x="13" y="5" width="7" height="14" rx="1"/>'),
  full: si('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  help: si('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17v.2"/>')
};
const canvaList = () => { const l = CONFIG.projects.filter(x => appFor(x) === 'canva'); return l.length ? l : CONFIG.projects.filter(x => x.type === 'design').slice(0, 3); };

function openCanva(p, from) {
  const list = canvaList();
  p = p || list[0];
  const ex = WM.list.get('app-canva');
  if (ex) { if (ex.minimized) WM.restore(ex.id); else WM.focus(ex.id); ex.state.load(p); return; }
  WM.open('app-canva', { app: 'canva', kind: 'canva', title: 'Canva', w: 1180, h: 740, chrome: 'none', cls: 'win-light win-canva', minW: 720, from, build: (body, rec) => buildCanva(body, rec, p) });
}
function buildCanva(body, rec, first) {
  const all = canvaList();
  const fmts = { all: 'Tout', ...Object.fromEntries(Object.entries(FMT).filter(([k]) => all.some(p => p.format === k)).map(([k, v]) => [k, v + 's'])) };
  const RAIL = [['design', 'Design'], ['elements', 'Éléments'], ['text', 'Texte'], ['brand', 'Marque'], ['upload', 'Importer'], ['tools', 'Outils'], ['projects', 'Projets'], ['apps', 'Applications']];
  body.innerHTML = `<div class="cva">
    <header class="cva-top" data-drag>
      <div class="tl-slot"></div>
      <button class="cva-hb">Accueil</button><button class="cva-hb hide-s">Fichier</button><button class="cva-hb hide-s">${CVI.resize}Redimensionner</button>
      <span class="cva-ur hide-s">${CVI.undo}${CVI.redo}${CVI.cloud}</span>
      <span class="cva-sp"></span>
      <span class="cva-title"></span>
      <span class="cva-av">${avatarHTML()}</span>
      <button class="cva-share" data-a="share">${G.share}Partager</button>
    </header>
    <div class="cva-main">
      <nav class="cva-rail">${RAIL.map(([k, l]) => `<button class="${k === 'projects' ? 'on' : ''}" data-r="${k}"><span>${CVI[k]}</span>${l}</button>`).join('')}</nav>
      <aside class="cva-panel">
        <label class="cva-search">${G.search}<input type="search" placeholder="Rechercher dans vos projets" aria-label="Rechercher un design"></label>
        <div class="cva-chips">${Object.entries(fmts).map(([k, v], i) => `<button data-f="${k}" class="${i === 0 ? 'on' : ''}">${v}</button>`).join('')}</div>
        <div class="cva-about"></div>
        <div class="cva-h">Designs</div>
        <div class="cva-grid"></div>
      </aside>
      <section class="cva-stage">
        <div class="cva-ctx"><span>${CVI.design}Modifier</span><span>${CVI.elements}Animer</span><span class="sp"></span><span>Position</span><span>${G.lock}</span></div>
        <div class="cva-canvas"><div class="cva-pages"></div></div>
        <footer class="cva-foot"><span>${CVI.notes}Notes</span><span class="hide-s">${CVI.timer}Durée</span><span class="sp"></span><span class="cva-zoom"><i><b></b></i><em class="mono">38 %</em></span><span class="cva-pn">Pages 1 / 1</span><span class="hide-s">${CVI.pages}</span><span class="hide-s">${CVI.full}</span><span>${CVI.help}</span></footer>
      </section>
    </div>
  </div>`;
  const st = { p: null, f: 'all', q: '' };
  rec.state = st;
  const grid = $('.cva-grid', body);
  const renderGrid = () => {
    const items = all.filter(p => (st.f === 'all' || p.format === st.f) && (!st.q || norm(p.title).includes(norm(st.q))));
    grid.innerHTML = items.length ? items.map(p => `<button class="cva-card ${st.p && p.id === st.p.id ? 'on' : ''}" data-id="${p.id}"><div class="cva-th fmt-${p.format || 'affiche'}">${poster(p)}</div><b>${esc(p.title)}</b><small>${esc(FMT[p.format] || 'Design')} · ${esc(p.year)}</small></button>`).join('')
      : `<p class="cva-empty">Aucun design trouvé</p>`;
  };
  function load(p) {
    if (!p) return;
    st.p = p;
    rec.setTitle(`Canva — ${p.title}`);
    $('.cva-title', body).textContent = p.title;
    const pages = asList(p.gallery).length ? asList(p.gallery) : [coverOf(p) || null];
    $('.cva-pages', body).innerHTML = pages.map((src, i) => `<div class="cva-pw"><div class="cva-ptitle"><b>Page ${i + 1}</b> – ${esc(i === 0 ? p.title : 'Déclinaison')}</div><div class="cva-page fmt-${p.format || 'affiche'}">${src ? `<img src="${esc(src)}" alt="${esc(p.title)} — page ${i + 1}">` : poster(p, { hue: i * 24 })}</div></div>`).join('') + '<button class="cva-add">+ Ajouter une page</button>';
    $('.cva-pn', body).textContent = `Pages 1 / ${pages.length}`;
    $('.cva-about', body).innerHTML = `<div class="cva-ab"><b>${esc(p.title)}</b><small>${esc(p.client)} · ${esc(p.year)} · ${esc(p.role)}</small><p>${esc(p.description)}</p><div class="cva-tags">${(p.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`;
    renderGrid();
    $('.cva-canvas', body).scrollTop = 0;
  }
  st.load = load;
  $('.cva-chips', body).addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; st.f = b.dataset.f; $$('.cva-chips button', body).forEach(x => x.classList.toggle('on', x === b)); renderGrid(); });
  $('.cva-search input', body).addEventListener('input', e => { st.q = e.target.value; renderGrid(); });
  grid.addEventListener('click', e => { const c = e.target.closest('.cva-card'); if (c) load(byId(c.dataset.id)); });
  $('.cva-rail', body).addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) $$('.cva-rail button', body).forEach(x => x.classList.toggle('on', x === b)); });
  $('[data-a="share"]', body).addEventListener('click', () => openContact());
  load(first);
}

/* ==================================================================
   CONTACT — envoi commun (page Contact + app Mail)
   ================================================================== */
const MAIL_SENT = [];
const SUBJECTS = ['Demande de devis', 'Projet vidéo', 'Shooting photo', 'Motion design', 'Collaboration', 'Stage / alternance'];
const emailOK = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());

async function sendMessage(d) {
  if (CONFIG.formEndpoint) {
    try {
      const r = await fetch(CONFIG.formEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: d.name, email: d.email, _replyto: d.email, _subject: d.subject || 'Contact depuis le portfolio', subject: d.subject, message: d.message })
      });
      if (r.ok) return 'sent';
    } catch (e) { /* réseau indisponible : on passe par la messagerie */ }
  }
  const sig = [d.name, d.email].filter(Boolean).join(' · ');
  const a = document.createElement('a');
  a.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(d.subject || 'Contact depuis le portfolio')}&body=${encodeURIComponent(d.message + (sig ? `\n\n— ${sig}` : ''))}`;
  document.body.append(a); a.click(); a.remove();
  return 'mailto';
}
/* Relie un formulaire (champs name/email/subject/message + bouton [data-send]) */
function wireContactForm(root, { onSent } = {}) {
  const f = n => $(`[name="${n}"]`, root);
  const shake = el => { el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 340 }); el.focus(); el.classList.add('err'); setTimeout(() => el.classList.remove('err'), 1600); };
  $$('[data-subj]', root).forEach(b => b.addEventListener('click', () => { f('subject').value = b.dataset.subj; $$('[data-subj]', root).forEach(x => x.classList.toggle('on', x === b)); }));
  const send = async () => {
    const d = { name: f('name').value.trim(), email: f('email').value.trim(), subject: f('subject').value.trim(), message: f('message').value.trim() };
    if ($('[name="_gotcha"]', root) && $('[name="_gotcha"]', root).value) return;
    if (d.email && !emailOK(d.email)) { shake(f('email')); return; }
    if (CONFIG.formEndpoint && !d.email) { shake(f('email')); f('email').placeholder = 'Votre e-mail pour que je puisse répondre'; return; }
    if (!d.message) { shake(f('message')); f('message').placeholder = 'Écrivez votre message avant d\'envoyer'; return; }
    root.classList.add('sending');
    $$('[data-send]', root).forEach(b => { b.disabled = true; });
    await sleep(700);
    const how = await sendMessage(d);
    root.classList.remove('sending'); root.classList.add('sent');
    MAIL_SENT.unshift({ ...d, date: new Date(), how });
    if (how === 'sent') notify({ title: 'Message envoyé', body: `Merci ! ${firstName()} vous répondra très vite.`, ic: 'mail', app: 'Mail' });
    else notify({ title: 'Message prêt à partir', body: 'Votre messagerie s\'est ouverte avec le message. Il ne reste qu\'à cliquer sur Envoyer.', ic: 'mail', app: 'Mail', time: 7000 });
    refreshMail();
    if (onSent) onSent(d, how);
    setTimeout(() => { root.classList.remove('sent'); $$('[data-send]', root).forEach(b => { b.disabled = false; }); if (how === 'sent') { f('message').value = ''; } }, 2600);
  };
  $$('[data-send]', root).forEach(b => b.addEventListener('click', e => { e.preventDefault(); send(); }));
  f('message').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } });
}
const socialRows = () => CONFIG.socials.map(s => `<a class="soc" href="${esc(s.url)}" target="_blank" rel="noopener"><span class="soc-l">${socialLogo(s.network)}</span><span><b>${esc((SOCIAL[s.network] || {}).label || s.label || s.network)}</b><small>${esc(s.handle)}</small></span>${G.ext}</a>`).join('');

/* ==================================================================
   CONTACT (page « Contact » de la barre de menus)
   ================================================================== */
function openContact(from) {
  WM.open('app-contact', {
    app: 'contacts', kind: 'contact', title: 'Contact', w: 920, h: 640, cls: 'win-contact', minW: 560, from,
    build: body => {
      body.innerHTML = `<div class="ct">
        <section class="ct-card">
          <div class="ct-head">
            <span class="ct-av">${avatarHTML()}</span>
            <h2>${esc(CONFIG.name)}</h2><p>${esc(CONFIG.role)}</p>
            <div class="ct-status"><i></i>${esc(CONFIG.status)}</div>
            <div class="ct-acts">
              <button data-c="write"><span>${G.bubble}</span>message</button>
              <a href="mailto:${esc(CONFIG.email)}"><span>${G.mail}</span>e-mail</a>
              ${CONFIG.phone ? `<a href="tel:${esc(CONFIG.phone.replace(/\s/g, ''))}"><span>${G.phone}</span>appel</a>` : ''}
              <button data-c="copy"><span>${G.copy}</span>copier</button>
            </div>
          </div>
          <dl class="ct-fields">
            <div><dt>e-mail</dt><dd><button class="ct-mail" data-c="copy">${esc(CONFIG.email)}</button></dd></div>
            ${CONFIG.phone ? `<div><dt>téléphone</dt><dd>${esc(CONFIG.phone)}</dd></div>` : ''}
            <div><dt>ville</dt><dd>${esc(CONFIG.city)}</dd></div>
            <div><dt>métier</dt><dd>${esc(CONFIG.role)}</dd></div>
          </dl>
          <div class="ct-soc">${socialRows()}</div>
          <div class="ct-more"><button class="btn sm" data-c="pres"><span class="btn-ico">${icon('keynote')}</span>Présentation</button><button class="btn sm" data-c="cv">${G.doc}CV</button><button class="btn sm" data-c="mail"><span class="btn-ico">${icon('mail')}</span>Ouvrir Mail</button></div>
        </section>
        <section class="ct-form cform">
          <h3>Envoyer un message</h3>
          <p class="ct-sub">Un projet, une question, une collaboration ? Je réponds en général sous 24 h.</p>
          <div class="ct-2"><label><span>Nom</span><input name="name" autocomplete="name" placeholder="Votre nom"></label><label><span>E-mail</span><input name="email" type="email" autocomplete="email" placeholder="vous@exemple.fr"></label></div>
          <label><span>Objet</span><input name="subject" placeholder="Projet vidéo, collaboration…"></label>
          <div class="ct-sugg">${SUBJECTS.map(s => `<button type="button" data-subj="${esc(s)}">${esc(s)}</button>`).join('')}</div>
          <label class="grow"><span>Message</span><textarea name="message" placeholder="Bonjour ${esc(firstName())},&#10;&#10;Je vous contacte au sujet de…"></textarea></label>
          <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="ct-foot"><small>${CONFIG.formEndpoint ? 'Le message m\'arrive directement par e-mail.' : 'Votre messagerie s\'ouvrira avec le message prêt à partir.'}</small><button class="btn primary" data-send>${G.send}Envoyer</button></div>
          <div class="cf-done"><span class="cf-plane">${G.send}</span><b>Message envoyé</b><small>Merci, à très vite !</small></div>
        </section>
      </div>`;
      wireContactForm($('.ct-form', body));
      body.addEventListener('click', e => {
        const b = e.target.closest('[data-c]'); if (!b) return; const k = b.dataset.c;
        if (k === 'copy') copyEmail();
        else if (k === 'write') $('[name="message"]', body).focus();
        else if (k === 'pres') openPresentation(b.getBoundingClientRect());
        else if (k === 'cv') openCV(b.getBoundingClientRect());
        else if (k === 'mail') openMail(b.getBoundingClientRect());
      });
    }
  });
}

/* ==================================================================
   MAIL (réception + nouveau message pour me contacter)
   ================================================================== */
function inboxMessages() {
  const pres = '<a data-m="pres">Présentation</a>';
  return [
    { id: 'm1', subject: 'Bienvenue sur mon portfolio 👋', time: '09:41', unread: true,
      prev: `Merci de passer ! Pour me contacter, réponds simplement à ce message.`,
      body: `<p>Bonjour,</p><p>Merci de passer sur mon portfolio ! Je suis ${esc(CONFIG.role.toLowerCase())}, basé à ${esc(CONFIG.city)}.</p><p>Pour découvrir qui je suis, ouvre la ${pres} (en haut de l'écran). Mes projets sont dans le Finder et sur le bureau, et mes storyboards dans Notes.</p><p><b>Pour me contacter</b>, clique sur « Répondre » ou sur le bouton ci-dessous : ton message m'arrivera directement.</p><p>À très vite,<br>${esc(firstName())}</p>`,
      cta: [['reply', 'Écrire à ' + firstName()], ['pres', 'Voir la présentation']] },
    { id: 'm2', subject: `${REEL.title} — à voir en premier`, time: 'Hier',
      prev: `Une minute et demie pour voir mon univers : clips, aftermovies, films de marque…`,
      body: `<p>Si tu n'as qu'une minute, commence par mon showreel : une sélection de mes meilleurs plans, montés et étalonnés sur DaVinci Resolve.</p><p>Il s'ouvre directement dans le logiciel, avec la timeline du montage.</p>`,
      cta: [['reel', 'Lire le showreel'], ['reply', 'Répondre']] },
    { id: 'm3', subject: 'Mes disponibilités', time: 'Lundi',
      prev: CONFIG.status,
      body: `<p>${esc(CONFIG.status)}.</p><p>Tournage, montage, motion design, photo ou storyboard : décris-moi ton projet, je te réponds avec un devis et un planning.</p>`,
      cta: [['reply', 'Proposer un projet'], ['cv', 'Voir mon CV']] }
  ];
}
function openMail(from) {
  WM.open('app-mail', {
    app: 'mail', kind: 'mail', title: 'Réception', w: 1060, h: 640, chrome: 'none', cls: 'win-mail', minW: 620, from,
    build: (body, rec) => {
      body.innerHTML = `<div class="ml">
        <aside class="ml-side"><div class="ml-side-top" data-drag><div class="tl-slot"></div></div>
          <div class="ml-h">Favoris</div>
          <button class="ml-box on" data-box="inbox">${G.inbox}<span>Réception</span><em class="ml-badge">1</em></button>
          <button class="ml-box" data-box="vip">${G.star}<span>VIP</span></button>
          <button class="ml-box" data-box="sent">${G.sentBox}<span>Envoyés</span><em class="ml-scount"></em></button>
          <div class="ml-h">iCloud</div>
          <button class="ml-box" data-box="inbox">${G.inbox}<span>Réception</span></button>
          <button class="ml-box" data-box="drafts">${G.doc}<span>Brouillons</span></button>
          <button class="ml-box" data-box="sent">${G.sentBox}<span>Envoyés</span></button>
          <button class="ml-box" data-box="junk">${G.junk}<span>Indésirables</span></button>
          <button class="ml-box" data-box="trash">${G.trash}<span>Corbeille</span></button>
          <button class="ml-box" data-box="archive">${G.archive}<span>Archives</span></button>
        </aside>
        <section class="ml-list">
          <header class="ml-lh" data-drag><div class="tl-slot ml-mtl"></div><div class="ml-lt"><b class="ml-bt">Réception</b><small class="ml-bc"></small></div></header>
          <button class="ml-cta" data-m="compose">${G.compose}<span><b>Écrire à ${esc(firstName())}</b><small>Nouveau message · réponse sous 24 h</small></span></button>
          <div class="ml-items"></div>
        </section>
        <section class="ml-view">
          <header class="ml-tb" data-drag>
            <button data-m="compose" class="ml-tbb accent" aria-label="Nouveau message">${G.compose}</button>
            <span class="ml-sep"></span>
            <button class="ml-tbb" aria-label="Archiver">${G.archive}</button><button class="ml-tbb" aria-label="Supprimer">${G.trash}</button><button class="ml-tbb hide-s" aria-label="Indésirable">${G.junk}</button>
            <span class="ml-sep"></span>
            <button data-m="reply" class="ml-tbb" aria-label="Répondre">${G.reply}</button><button data-m="reply" class="ml-tbb hide-s" aria-label="Répondre à tous">${G.replyAll}</button><button data-m="forward" class="ml-tbb hide-s" aria-label="Transférer">${G.forward}</button>
            <span class="ml-sep"></span><button class="ml-tbb hide-s" aria-label="Signaler">${G.flag}</button>
            <span class="ml-sp"></span><label class="ml-search">${G.search}<input placeholder="Rechercher" aria-label="Rechercher"></label>
          </header>
          <div class="ml-msg"></div>
        </section></div>`;
      rec.state = { box: 'inbox', sel: 'm1', read: new Set() };
      body.addEventListener('click', e => {
        const bx = e.target.closest('[data-box]'); if (bx) { rec.state.box = bx.dataset.box; rec.state.sel = null; $$('.ml-box', body).forEach(x => x.classList.toggle('on', x.dataset.box === bx.dataset.box && x === bx)); renderMail(rec); return; }
        const it = e.target.closest('.ml-it'); if (it) { rec.state.sel = it.dataset.id; renderMail(rec); return; }
        const m = e.target.closest('[data-m]'); if (!m) return;
        const k = m.dataset.m, cur = inboxMessages().find(x => x.id === rec.state.sel);
        if (k === 'compose') openCompose({}, m.getBoundingClientRect());
        else if (k === 'reply') openCompose({ subject: cur ? 'Re: ' + cur.subject.replace(/\s*[👋]/u, '') : '' }, m.getBoundingClientRect());
        else if (k === 'forward') copyEmail();
        else if (k === 'pres') openPresentation(m.getBoundingClientRect());
        else if (k === 'reel') openShowreel(m.getBoundingClientRect());
        else if (k === 'cv') openCV(m.getBoundingClientRect());
      });
      renderMail(rec);
    }
  });
}
function refreshMail() { const r = WM.list.get('app-mail'); if (r) renderMail(r); }
function renderMail(rec) {
  const body = rec.body, st = rec.state;
  if (st.sel) st.read.add(st.sel);
  const inbox = inboxMessages().map(m => ({ ...m, unread: m.unread && !st.read.has(m.id) }));
  const fmt = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const sent = MAIL_SENT.map((m, i) => ({ id: 's' + i, subject: m.subject || 'Contact depuis le portfolio', time: fmt(m.date), prev: m.message, sent: m }));
  const list = st.box === 'inbox' ? inbox : st.box === 'sent' ? sent : st.box === 'vip' ? inbox.slice(0, 1) : [];
  const names = { inbox: 'Réception', vip: 'VIP', sent: 'Envoyés', drafts: 'Brouillons', junk: 'Indésirables', trash: 'Corbeille', archive: 'Archives' };
  $('.ml-bt', body).textContent = names[st.box];
  const unread = inbox.filter(m => m.unread).length;
  $('.ml-bc', body).textContent = `${list.length} message${list.length > 1 ? 's' : ''}${st.box === 'inbox' && unread ? `, ${unread} non lu${unread > 1 ? 's' : ''}` : ''}`;
  const badge = $('.ml-badge', body); badge.textContent = unread; badge.style.display = unread ? '' : 'none';
  $('.ml-scount', body).textContent = MAIL_SENT.length || '';
  if (!st.sel && list.length) st.sel = list[0].id;
  const from = st.box === 'sent' ? 'Moi' : CONFIG.name;
  $('.ml-items', body).innerHTML = list.length ? list.map(m => `<button class="ml-it ${m.id === st.sel ? 'on' : ''} ${m.unread ? 'unread' : ''}" data-id="${m.id}"><i class="ml-dot"></i><div class="ml-r1"><b>${esc(st.box === 'sent' ? CONFIG.name : from)}</b><span>${esc(m.time)}</span></div><div class="ml-sj">${esc(m.subject)}</div><div class="ml-pv">${esc(m.prev)}</div></button>`).join('')
    : `<p class="ml-empty">Aucun message</p>`;
  const m = list.find(x => x.id === st.sel);
  const view = $('.ml-msg', body);
  if (!m) { view.innerHTML = `<div class="ml-none">Aucun message sélectionné</div>`; return; }
  const head = (who, to) => `<div class="ml-mh"><span class="ml-av">${who === 'me' ? avatarHTML() : `<span>${esc((m.sent.name || '?').slice(0, 1).toUpperCase())}</span>`}</span><div class="ml-mhi"><b>${esc(who === 'me' ? CONFIG.name : (m.sent.name || 'Moi'))}</b><small>À : ${esc(to)}</small><h2>${esc(m.subject)}</h2></div><span class="ml-mt">${esc(m.time)}</span></div>`;
  if (m.sent) view.innerHTML = `${head('them', `${CONFIG.name} <${CONFIG.email}>`)}<div class="ml-body"><p>${esc(m.sent.message).replace(/\n/g, '<br>')}</p><p class="ml-note">${m.sent.how === 'sent' ? '✓ Envoyé' : '✓ Ouvert dans votre messagerie'}</p></div>`;
  else view.innerHTML = `${head('me', 'vous')}<div class="ml-body">${m.body}<div class="ml-ctas">${m.cta.map(([k, l], i) => `<button class="btn ${i === 0 ? 'primary' : ''}" data-m="${k}">${k === 'reply' ? G.reply : ''}${esc(l)}</button>`).join('')}</div>
      <div class="ml-sig"><span class="ml-av sm">${avatarHTML()}</span><div><b>${esc(CONFIG.name)}</b><small>${esc(CONFIG.role)} · ${esc(CONFIG.city)}</small><small>${esc(CONFIG.email)}</small></div></div></div>`;
}
function openCompose(o = {}, from) {
  const ex = WM.list.get('mail-compose');
  if (ex) { WM.focus(ex.id); if (o.subject) $('[name="subject"]', ex.body).value = o.subject; return; }
  WM.open('mail-compose', {
    app: 'mail', kind: 'compose', title: 'Nouveau message', w: 640, h: 580, chrome: 'none', cls: 'win-compose', minW: 420, from,
    build: (body, rec) => {
      body.innerHTML = `<div class="mc cform">
        <header class="mc-tb" data-drag><div class="tl-slot"></div><button class="mc-send" data-send aria-label="Envoyer">${G.send}</button><span class="mc-title">Nouveau message</span><span class="mc-sp"></span><button class="mc-ic" aria-label="Format">${G.aa}</button><button class="mc-ic" aria-label="Pièce jointe">${G.link}</button></header>
        <div class="mc-f"><label>À :</label><span class="mc-chip"><span class="mc-av">${avatarHTML()}</span>${esc(CONFIG.name)}</span><button class="mc-copy" data-cp>${G.copy}<span>${esc(CONFIG.email)}</span></button></div>
        <div class="mc-f"><label>De :</label><input name="name" placeholder="Votre nom" autocomplete="name"><input name="email" type="email" placeholder="votre@adresse.fr" autocomplete="email"></div>
        <div class="mc-f"><label>Objet :</label><input name="subject" value="${esc(o.subject || '')}" placeholder="Projet vidéo, collaboration…"></div>
        <div class="mc-sugg">${SUBJECTS.map(s => `<button type="button" data-subj="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <textarea name="message" placeholder="Bonjour ${esc(firstName())},&#10;&#10;Je vous contacte au sujet de…" aria-label="Message"></textarea>
        <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="mc-foot"><small>${CONFIG.formEndpoint ? 'Envoi direct · ⌘↩ pour envoyer' : 'S\'ouvre dans votre messagerie · ⌘↩ pour envoyer'}</small><button class="btn primary" data-send>${G.send}Envoyer</button></div>
        <div class="cf-done"><span class="cf-plane">${G.send}</span><b>Message envoyé</b><small>Merci, à très vite !</small></div>
      </div>`;
      $('[data-cp]', body).addEventListener('click', copyEmail);
      wireContactForm($('.mc', body), { onSent: (d, how) => { if (how === 'sent') setTimeout(() => WM.close(rec.id), 2200); } });
      setTimeout(() => { const n = $('[name="name"]', body); if (n && !isTouch()) n.focus(); }, 350);
    }
  });
}

/* ==================================================================
   NOTES (à propos + storyboards)
   ================================================================== */
function notesData() {
  const sb = CONFIG.storyboards || [];
  const about = [
    { id: 'bio', folder: 'notes', title: 'À propos de moi', prev: CONFIG.bio[0], date: 'Aujourd\'hui' },
    { id: 'skills', folder: 'notes', title: 'Compétences', prev: CONFIG.skills.map(s => s.label).join(', '), date: 'Aujourd\'hui' },
    { id: 'path', folder: 'notes', title: 'Parcours', prev: CONFIG.path.map(p => p.title).join(' · '), date: 'Hier' },
    { id: 'gear', folder: 'notes', title: 'Matériel', prev: CONFIG.gear.join(', '), date: 'Hier' }
  ];
  const boards = sb.map(s => ({ id: 'sb:' + s.id, folder: 'storyboards', title: s.title, prev: s.description, date: s.date || '', sb: s }));
  return [...boards, ...about];
}
const NOTE_FOLDERS = [['all', 'Toutes les notes iCloud'], ['notes', 'Notes'], ['storyboards', 'Storyboards']];

function openNotes(target, from) {
  target = target || 'bio';
  const apply = rec => {
    if (target.startsWith('folder:')) { rec.state.folder = target.slice(7); rec.state.sel = null; }
    else { rec.state.sel = target; const n = notesData().find(x => x.id === target); if (n && rec.state.folder !== 'all' && rec.state.folder !== n.folder) rec.state.folder = n.folder; }
    renderNotes(rec);
  };
  WM.open('app-notes', {
    app: 'notes', kind: 'notes', title: 'Notes', w: 1040, h: 660, chrome: 'none', cls: 'win-notes', minW: 600, from,
    reuse: apply,
    build: (body, rec) => {
      body.innerHTML = `<div class="nt">
        <aside class="nt-side"><div class="nt-side-top" data-drag><div class="tl-slot"></div></div>
          <div class="nt-h">iCloud</div>
          ${NOTE_FOLDERS.map(([k, l]) => `<button class="nt-f" data-f="${k}"><span class="nt-fi">${G.folder}</span><span class="nt-fl">${l}</span><em></em></button>`).join('')}
        </aside>
        <section class="nt-list">
          <header class="nt-lh" data-drag><div class="tl-slot nt-mtl"></div><div><b class="nt-ft"></b><small class="nt-fc"></small></div></header>
          <div class="nt-items"></div>
        </section>
        <section class="nt-doc">
          <header class="nt-tb" data-drag><button class="nt-tbb" aria-label="Nouvelle note">${G.compose}</button><span class="nt-sp"></span>
            <button class="nt-tbb" aria-label="Format">${G.aa}</button><button class="nt-tbb" aria-label="Liste">${G.checklist}</button><button class="nt-tbb hide-s" aria-label="Tableau">${G.table}</button><button class="nt-tbb hide-s" aria-label="Pièce jointe">${G.image}</button>
            <span class="nt-sp"></span><button class="nt-tbb hide-s" aria-label="Verrouiller">${G.lock}</button><button class="nt-tbb" aria-label="Partager">${G.share}</button><button class="nt-tbb hide-s" aria-label="Rechercher">${G.search}</button></header>
          <article class="nt-body"></article>
          <div class="sb-lb hidden"></div>
        </section></div>`;
      rec.state = { folder: 'notes', sel: null, lb: null };
      body.addEventListener('click', e => {
        const f = e.target.closest('[data-f]'); if (f) { rec.state.folder = f.dataset.f; rec.state.sel = null; renderNotes(rec); return; }
        const it = e.target.closest('.nt-it'); if (it) { rec.state.sel = it.dataset.id; renderNotes(rec); return; }
        const fr = e.target.closest('.sb-fr'); if (fr) { openLightbox(rec, +fr.dataset.k); return; }
        const op = e.target.closest('[data-open]'); if (op) { openProject(byId(op.dataset.open), op.getBoundingClientRect()); return; }
        const lb = e.target.closest('[data-lb]'); if (lb) { const k = lb.dataset.lb; if (k === 'x') closeLightbox(rec); else openLightbox(rec, rec.state.lb + Number(k)); return; }
        if (e.target.classList.contains('sb-lb')) closeLightbox(rec);
      });
      rec.onkey = e => {
        if (rec.state.lb === null) return;
        if (e.key === 'Escape') closeLightbox(rec);
        else if (e.key === 'ArrowRight') openLightbox(rec, rec.state.lb + 1);
        else if (e.key === 'ArrowLeft') openLightbox(rec, rec.state.lb - 1);
      };
      apply(rec);
    }
  });
}
function renderNotes(rec) {
  const body = rec.body, st = rec.state, all = notesData();
  const list = all.filter(n => st.folder === 'all' || n.folder === st.folder);
  if (!list.find(n => n.id === st.sel)) st.sel = list[0] ? list[0].id : null;
  $$('.nt-f', body).forEach(b => { b.classList.toggle('on', b.dataset.f === st.folder); $('em', b).textContent = all.filter(n => b.dataset.f === 'all' || n.folder === b.dataset.f).length; });
  $('.nt-ft', body).textContent = (NOTE_FOLDERS.find(f => f[0] === st.folder) || [])[1];
  $('.nt-fc', body).textContent = `${list.length} note${list.length > 1 ? 's' : ''}`;
  $('.nt-items', body).innerHTML = list.map(n => `<button class="nt-it ${n.id === st.sel ? 'on' : ''}" data-id="${n.id}"><div><b>${esc(n.title)}</b><small><span>${esc(n.date)}</span> ${esc(n.prev)}</small>${st.folder === 'all' ? `<em>${G.folder}${n.folder === 'storyboards' ? 'Storyboards' : 'Notes'}</em>` : ''}</div>${n.sb ? `<span class="nt-th">${frameImg(n.sb, 0)}</span>` : ''}</button>`).join('');
  const n = list.find(x => x.id === st.sel);
  const doc = $('.nt-body', body);
  closeLightbox(rec);
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.innerHTML = n ? `<div class="n-date">${date}</div>${n.sb ? storyboardHTML(n.sb) : noteHTML(n.id)}` : '<p class="n-muted">Aucune note</p>';
  doc.scrollTop = 0;
  $$('.sk b', doc).forEach(b => {
    const v = +b.dataset.v, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / 900); b.textContent = Math.round(v * (1 - Math.pow(1 - k, 3))) + ' %'; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function noteHTML(id) {
  if (id === 'bio') return `<div class="n-hero"><span class="n-av">${avatarHTML()}</span><div><h1>${esc(CONFIG.name)}</h1><p>${esc(CONFIG.role)} · ${esc(CONFIG.city)}</p></div></div>${CONFIG.bio.map(t => `<p>${esc(t)}</p>`).join('')}<h3>Logiciels</h3><div class="n-tools">${CONFIG.tools.map(t => `<span><i>${toolLogo(t)}</i>${esc(t)}</span>`).join('')}</div>`;
  if (id === 'skills') return `<h1>Compétences</h1><p class="n-muted">Ce que je fais au quotidien, du storyboard à l'export.</p><div class="sk-list">${CONFIG.skills.map((s, i) => `<div class="sk"><span>${esc(s.label)}</span><b class="mono" data-v="${s.value}">0 %</b><div class="sk-bar"><i style="--w:${s.value}%;animation-delay:${i * 80}ms"></i></div></div>`).join('')}</div>`;
  if (id === 'path') return `<h1>Parcours</h1><div class="n-tl">${CONFIG.path.map(p => `<div class="n-step"><span class="mono">${esc(p.year)}</span><div><b>${esc(p.title)}</b><p>${esc(p.text)}</p></div></div>`).join('')}</div>`;
  return `<h1>Matériel</h1><ul class="n-check">${CONFIG.gear.map(g => `<li><i>${G.check}</i>${esc(g)}</li>`).join('')}</ul>`;
}
/* esquisse au crayon générée quand une case de storyboard n'a pas d'image */
function sketchSVG(seed, fr = {}) {
  const r = rng(seed), j = (v, a = 1.2) => (v + (r() - 0.5) * a).toFixed(1);
  const line = (x1, y1, x2, y2) => `<path d="M${j(x1)} ${j(y1)} Q${j((x1 + x2) / 2, 3)} ${j((y1 + y2) / 2, 3)} ${j(x2)} ${j(y2)}"/>`;
  const fm = norm(fr.framing || ''), mv = norm(fr.move || '');
  let s = '';
  const hy = 52 + r() * 10;
  if (/gros|insert/.test(fm)) {
    const cx = 80 + (r() - 0.5) * 30;
    if (/insert/.test(fm)) s += `${line(30, 70, 120, 64)}<rect x="${j(55)}" y="${j(32)}" width="50" height="26" rx="4"/>${line(60, 45, 98, 45)}`;
    else s += `<ellipse cx="${j(cx)}" cy="${j(44)}" rx="22" ry="27"/>${line(cx - 9, 40, cx - 4, 40)}${line(cx + 4, 40, cx + 9, 40)}${line(cx - 5, 56, cx + 5, 56)}${line(cx - 30, 90, cx - 16, 66)}${line(cx + 30, 90, cx + 16, 66)}`;
  } else {
    s += line(0, hy, 160, hy + (r() - 0.5) * 6);
    const n = /ensemble/.test(fm) ? 7 : 4;
    for (let i = 0; i < n; i++) { const x = (i / n) * 160 + r() * 8, w = 12 + r() * 14, hh = 14 + r() * 30; s += `<rect x="${j(x)}" y="${j(hy - hh)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}"/>`; for (let k = 0; k < 3; k++) s += line(x + 3, hy - hh + 5 + k * 6, x + w - 3, hy - hh + 5 + k * 6); }
    const fx = 40 + r() * 80, sc = /moyen|rapproch|contrechamp/.test(fm) ? 2.3 : /ensemble/.test(fm) ? 0.6 : 1;
    const fy = /moyen|rapproch|contrechamp/.test(fm) ? 92 : hy + 4;
    s += `<g transform="translate(${fx.toFixed(1)} ${fy}) scale(${sc})"><circle cx="0" cy="-26" r="4.2"/>${line(0, -22, 0, -9)}${line(0, -9, -4, 0)}${line(0, -9, 4, 0)}${line(0, -19, -6, -12)}${line(0, -19, 6, -13)}</g>`;
  }
  // flèche de mouvement de caméra
  if (/travelling avant|avant/.test(mv)) s += `<g class="mv"><path d="M80 82V66"/><path d="M75 71l5-6 5 6"/></g>`;
  else if (/arriere/.test(mv)) s += `<g class="mv"><path d="M80 66v16"/><path d="M75 77l5 6 5-6"/></g>`;
  else if (/pano/.test(mv)) s += `<g class="mv"><path d="M40 80Q80 70 120 80"/><path d="M114 75l6 5-7 3"/></g>`;
  else if (/drone|montee/.test(mv)) s += `<g class="mv"><path d="M140 70V40"/><path d="M135 46l5-6 5 6"/></g>`;
  for (let i = 0; i < 6; i++) { const x = 6 + r() * 30; s += line(x, 84 - i * 2, x + 10, 78 - i * 2); }
  return `<svg class="sk-svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="#fbfaf5"/><g fill="none" stroke="#4a4a48" stroke-opacity=".72" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round">${s}</g></svg>`;
}
const frameImg = (sb, k) => { const fr = (sb.frames || [])[k] || {}; if (!fr.image && !(sb.frames || []).length && asList(sb.pages)[0]) return `<img src="${esc(asList(sb.pages)[0])}" alt="" loading="lazy">`; return fr.image ? `<img src="${esc(fr.image)}" alt="${esc(sb.title)} — ${esc(fr.shot || 'plan ' + (k + 1))}" loading="lazy">` : sketchSVG(sb.id + k, fr); };
function storyboardHTML(sb) {
  const fr = sb.frames || [];
  const nPlans = fr.length;
  const total = fr.reduce((a, f) => a + (parseFloat(String(f.duration || '').replace(',', '.')) || 0), 0);
  const p = sb.project && byId(sb.project);
  return `<h1>${esc(sb.title)}</h1>
    <p class="sb-desc">${esc(sb.description || '')}</p>
    <div class="sb-meta">${nPlans ? `<span>${G.pencil}${nPlans} plan${nPlans > 1 ? 's' : ''}</span>` : ''}${asList(sb.pages).length ? `<span>${G.image}${asList(sb.pages).length} planche${asList(sb.pages).length > 1 ? 's' : ''}</span>` : ''}${total ? `<span>${G.clock}≈ ${Math.round(total)} s</span>` : ''}${p ? `<button class="sb-link" data-open="${p.id}">${G.film}Voir le film fini : ${esc(fileName(p))}</button>` : ''}</div>
    ${asList(sb.pages).map((src, k) => `<img class="sb-page" src="${esc(src)}" alt="${esc(sb.title)} — planche ${k + 1}" loading="lazy">`).join('')}
    <div class="sb-grid">${fr.map((f, k) => `<figure class="sb-fr" data-k="${k}" tabindex="0"><div class="sb-img">${frameImg(sb, k)}<span class="sb-n mono">${k + 1}</span></div>
      <figcaption><b>${esc(f.shot || 'Plan ' + (k + 1))}</b><span>${[f.framing, f.move, f.duration].filter(Boolean).map(esc).join(' · ')}</span><p>${esc(f.text || '')}</p></figcaption></figure>`).join('')}</div>
    ${fr.some(f => f.image) || asList(sb.pages).length || !fr.length ? '' : '<p class="n-muted sb-hint">Esquisses générées automatiquement : remplace-les par tes vraies planches dans config.js (champ « image »).</p>'}`;
}
function openLightbox(rec, k) {
  const n = notesData().find(x => x.id === rec.state.sel); if (!n || !n.sb) return;
  const fr = n.sb.frames || []; if (!fr.length) return;
  k = (k + fr.length) % fr.length; rec.state.lb = k;
  const f = fr[k], lb = $('.sb-lb', rec.body);
  lb.classList.remove('hidden');
  lb.innerHTML = `<div class="sb-lbin"><div class="sb-lbimg">${frameImg(n.sb, k)}</div>
    <div class="sb-lbcap"><b>${esc(f.shot || 'Plan ' + (k + 1))}</b><span>${[f.framing, f.move, f.duration].filter(Boolean).map(esc).join(' · ')}</span><p>${esc(f.text || '')}</p></div>
    <div class="sb-lbnav"><button data-lb="-1" aria-label="Plan précédent">${G.back}</button><span class="mono">${k + 1} / ${fr.length}</span><button data-lb="1" aria-label="Plan suivant">${G.fwd}</button><button data-lb="x" aria-label="Fermer">${G.close}</button></div></div>`;
}
function closeLightbox(rec) { rec.state.lb = null; const lb = $('.sb-lb', rec.body); if (lb) { lb.classList.add('hidden'); lb.innerHTML = ''; } }

/* ==================================================================
   KEYNOTE — « Présentation » : qui je suis
   ================================================================== */
function slidesData() {
  const P = CONFIG.presentation || {};
  const favs = CONFIG.projects.filter(p => p.fav).slice(0, 4);
  const years = CONFIG.path.length ? new Date().getFullYear() - Math.min(...CONFIG.path.map(p => +p.year || new Date().getFullYear())) : 0;
  const clients = new Set(CONFIG.projects.filter(p => p.category === 'pro').map(p => p.client)).size;
  const sb = (CONFIG.storyboards || [])[0];
  const head = (n, t) => `<div class="ks-k">${pad(n)}</div><h2 class="ks-h">${t}</h2>`;
  return [
    { t: 'Couverture', html: `<div class="ks ks-cover"><div class="ks-glow"></div>
        <div class="ks-cl"><div class="ks-kick">PORTFOLIO ${new Date().getFullYear()}</div><h1>${esc(P.hello || 'Bonjour, moi c\'est')}<br><em>${esc(firstName())}.</em></h1><p class="ks-role">${esc(CONFIG.role)} · ${esc(CONFIG.city)}</p><p class="ks-pitch">${esc(P.pitch || CONFIG.bio[0])}</p></div>
        <div class="ks-cr"><span class="ks-av">${avatarHTML()}</span></div>
        <div class="ks-foot">${esc(CONFIG.name)}<span>${esc(CONFIG.email)}</span></div></div>` },
    { t: 'Qui suis-je ?', html: `<div class="ks ks-bio">${head(1, 'Qui suis-je ?')}<div class="ks-cols"><div class="ks-text">${CONFIG.bio.map(t => `<p>${esc(t)}</p>`).join('')}</div>
        <div class="ks-stats"><div><b>${CONFIG.projects.length}</b><span>projets</span></div><div><b>${clients}</b><span>clients pro</span></div><div><b>${years || 1}</b><span>an${years > 1 ? 's' : ''} d'expérience</span></div></div></div></div>` },
    { t: 'Ce que je fais', html: `<div class="ks ks-serv">${head(2, 'Ce que je fais')}<div class="ks-cards">${(P.services || []).map(s => `<div class="ks-card"><span class="ks-ci">${G[s.icon] || G.sparkle}</span><b>${esc(s.title)}</b><p>${esc(s.text)}</p></div>`).join('')}</div></div>` },
    { t: 'Mes logiciels', html: `<div class="ks ks-tools">${head(3, 'Mes logiciels')}<div class="ks-logos">${CONFIG.tools.map(t => `<div class="ks-logo"><i>${toolLogo(t)}</i><span>${esc(t)}</span></div>`).join('')}</div></div>` },
    { t: 'Compétences', html: `<div class="ks ks-skills">${head(4, 'Compétences & matériel')}<div class="ks-cols"><div class="ks-bars">${CONFIG.skills.map(s => `<div class="ks-bar"><span>${esc(s.label)}<b>${s.value} %</b></span><i><u style="width:${s.value}%"></u></i></div>`).join('')}</div>
        <ul class="ks-gear">${CONFIG.gear.map(g => `<li>${G.check}${esc(g)}</li>`).join('')}</ul></div></div>` },
    { t: 'Parcours', html: `<div class="ks ks-path">${head(5, 'Parcours')}<div class="ks-tl">${CONFIG.path.slice().reverse().map(p => `<div class="ks-step"><b>${esc(p.year)}</b><i></i><strong>${esc(p.title)}</strong><p>${esc(p.text)}</p></div>`).join('')}</div></div>` },
    { t: 'Projets phares', html: `<div class="ks ks-proj">${head(6, 'Projets phares')}<div class="ks-pgrid">${favs.map(p => `<button class="ks-pc" data-open="${p.id}"><div class="ks-pth">${poster(p)}</div><b>${esc(p.title)}</b><small>${esc(p.client)} · ${esc(p.year)} · ${esc(APPS[appFor(p)].name)}</small></button>`).join('')}</div><p class="ks-hint">Clique sur un projet pour l'ouvrir dans son logiciel.</p></div>` },
    { t: 'Storyboards', html: `<div class="ks ks-sb">${head(7, 'De l\'idée à l\'image')}<p class="ks-lead">Chaque tournage commence par un storyboard : découpage, cadrages, mouvements de caméra.</p>
        ${sb ? `<div class="ks-strip">${(sb.frames || []).slice(0, 4).map((f, k) => `<div class="ks-fr"><div>${frameImg(sb, k)}</div><span>${esc(f.shot || '')} · ${esc(f.framing || '')}</span></div>`).join('')}</div>` : ''}
        <button class="ks-btn" data-go="notes">${G.pencil}Voir mes storyboards</button></div>` },
    { t: 'Contact', html: `<div class="ks ks-contact"><div class="ks-glow"></div><div class="ks-kick">CONTACT</div><h1>Travaillons<br><em>ensemble.</em></h1><p class="ks-pitch">${esc(P.closing || 'Un projet, une idée ? Écris-moi.')}</p>
        <div class="ks-mail">${esc(CONFIG.email)}</div>
        <div class="ks-socs">${CONFIG.socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc((SOCIAL[s.network] || {}).label || s.network)}">${socialLogo(s.network)}</a>`).join('')}</div>
        <div class="ks-ctas"><button class="ks-btn primary" data-go="contact">${G.send}Me contacter</button><button class="ks-btn" data-go="cv">${G.doc}Mon CV</button></div></div>` }
  ];
}
function openPresentation(from) {
  WM.open('app-keynote', {
    app: 'keynote', kind: 'keynote', title: `Présentation — ${CONFIG.name}.key`, w: 1200, h: 760, chrome: 'none', cls: 'win-keynote', minW: 600, from,
    build: (body, rec) => {
      const slides = slidesData();
      body.innerHTML = `<div class="kn">
        <header class="kn-tb" data-drag>
          <div class="kn-title"><div class="tl-slot"></div><span>Présentation — ${esc(CONFIG.name)}</span><small>Modifié</small></div>
          <div class="kn-tools">
            <div class="kn-g"><button class="kn-b" data-k="nav">${G.sidebar}<span>Présentation</span></button><button class="kn-b hide-s"><b class="kn-zoom">100 %</b><span>Zoom</span></button><button class="kn-b hide-s">${G.plus}<span>Ajouter une diapo</span></button></div>
            <div class="kn-g"><button class="kn-b kn-play" data-k="play">${G.play}<span>Lire</span></button><button class="kn-b hide-s">${G.table}<span>Tableau</span></button><button class="kn-b hide-s">${G.chart}<span>Graphique</span></button><button class="kn-b hide-s">${G.text}<span>Texte</span></button><button class="kn-b hide-s">${G.shape}<span>Forme</span></button><button class="kn-b hide-s">${G.image}<span>Média</span></button><button class="kn-b hide-m">${G.comment}<span>Commentaire</span></button></div>
            <div class="kn-g"><button class="kn-b hide-m">${G.user}<span>Collaborer</span></button><button class="kn-b on" data-k="insp">${G.brush}<span>Format</span></button><button class="kn-b hide-s">${G.diamond}<span>Animer</span></button><button class="kn-b hide-s">${G.doc}<span>Document</span></button></div>
          </div>
        </header>
        <div class="kn-main">
          <nav class="kn-nav">${slides.map((s, i) => `<div class="kn-th" role="button" tabindex="0" data-i="${i}" aria-label="Diapositive ${i + 1} : ${esc(s.t)}"><span class="kn-num">${i + 1}</span><div class="kn-mini" aria-hidden="true"><div class="ks-scale" inert>${s.html}</div></div></div>`).join('')}</nav>
          <section class="kn-canvas"><div class="kn-wrap"><div class="ks-scale kn-cur"></div></div><div class="kn-arrows"><button data-d="-1" aria-label="Diapositive précédente">${G.back}</button><span class="mono kn-count"></span><button data-d="1" aria-label="Diapositive suivante">${G.fwd}</button></div></section>
          <aside class="kn-insp"><div class="kn-it"><b class="on">Disposition de la diapositive</b></div>
            <div class="kn-sec"><div class="kn-lay"><div class="kn-mini2" aria-hidden="true"><div class="ks-scale kn-lay-th" inert></div></div><span class="kn-lname"></span></div><button class="kn-btn">Modifier la disposition</button></div>
            <div class="kn-sec"><b>Apparence</b><label><i class="on"></i>Titre</label><label><i class="on"></i>Corps</label><label><i></i>Numéro de diapositive</label></div>
            <div class="kn-sec"><b>Arrière-plan</b><div class="kn-dd">Remplissage dégradé ${G.down}</div><div class="kn-sw"><i></i><i></i></div></div>
            <div class="kn-sec kn-tip"><p>Astuce : clique sur <b>Lire</b> pour lancer la présentation en plein écran. Flèches ← → pour naviguer.</p></div></aside>
        </div></div>`;
      const st = { i: 0 };
      rec.state = st;
      const cur = $('.kn-cur', body), canvas = $('.kn-canvas', body), wrap = $('.kn-wrap', body), kn = $('.kn', body);
      const fit = () => {
        const w = canvas.clientWidth - 48, hh = canvas.clientHeight - 70; if (w <= 0 || hh <= 0) return;
        const k = Math.min(w / 1280, hh / 720);
        wrap.style.width = Math.round(1280 * k) + 'px'; wrap.style.height = Math.round(720 * k) + 'px';
        cur.style.transform = `scale(${k})`;
        $('.kn-zoom', body).textContent = Math.round(k * 100) + ' %';
      };
      const go = i => {
        st.i = clamp(i, 0, slides.length - 1);
        cur.innerHTML = slides[st.i].html;
        $$('.kn-th', body).forEach((t, k) => t.classList.toggle('on', k === st.i));
        const th = $$('.kn-th', body)[st.i], nav = $('.kn-nav', body);
        if (th && nav) { const top = th.offsetTop, bot = top + th.offsetHeight; if (top < nav.scrollTop) nav.scrollTop = top - 10; else if (bot > nav.scrollTop + nav.clientHeight) nav.scrollTop = bot - nav.clientHeight + 10; }
        $('.kn-count', body).textContent = `${st.i + 1} / ${slides.length}`;
        $('.kn-lay-th', body).innerHTML = slides[st.i].html; $('.kn-lname', body).textContent = slides[st.i].t;
        if (!reduceMotion()) cur.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      };
      st.go = go;
      body.addEventListener('click', e => {
        const th = e.target.closest('.kn-th'); if (th) { go(+th.dataset.i); return; }
        const d = e.target.closest('[data-d]'); if (d) { go(st.i + Number(d.dataset.d)); return; }
        const k = e.target.closest('[data-k]');
        if (k) { if (k.dataset.k === 'play') slideshow(slides, st.i, i => go(i)); else if (k.dataset.k === 'nav') kn.classList.toggle('no-nav'); else if (k.dataset.k === 'insp') { k.classList.toggle('on'); kn.classList.toggle('no-insp'); } setTimeout(fit, 30); return; }
        slideAction(e);
      });
      rec.onkey = e => {
        if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); go(st.i + 1); }
        else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(st.i - 1); }
        else if (e.key === 'Enter' && (e.metaKey || e.altKey)) slideshow(slides, st.i, i => go(i));
      };
      const ro = new ResizeObserver(() => fit()); ro.observe(canvas);
      rec.onclose = () => ro.disconnect();
      go(0); requestAnimationFrame(fit);
    }
  });
}
function slideAction(e, before) {
  const op = e.target.closest('[data-open]'); const g = e.target.closest('[data-go]');
  if (!op && !g) return false;
  if (before) before();
  const r = (op || g).getBoundingClientRect();
  if (op) openProject(byId(op.dataset.open), r);
  else ({ contact: () => openContact(r), cv: () => openCV(r), notes: () => openNotes('folder:storyboards', r) }[g.dataset.go] || (() => {}))();
  return true;
}
/* Lecture plein écran de la présentation */
function slideshow(slides, start, onExit) {
  let i = start;
  const el = h(`<div class="kshow" role="dialog" aria-label="Présentation"><div class="kshow-stage"><div class="ks-scale kshow-cur"></div></div>
    <div class="kshow-ui"><button data-s="-1" aria-label="Précédente">${G.back}</button><span class="mono kshow-n"></span><button data-s="1" aria-label="Suivante">${G.fwd}</button><button data-s="x" aria-label="Quitter">${G.close}</button></div>
    <div class="kshow-prog"><i></i></div></div>`);
  document.body.append(el);
  const cur = $('.kshow-cur', el), stage = $('.kshow-stage', el);
  const fit = () => { const k = Math.min(innerWidth / 1280, innerHeight / 720); stage.style.width = 1280 * k + 'px'; stage.style.height = 720 * k + 'px'; cur.style.transform = `scale(${k})`; };
  const show = (n, dir = 1) => {
    i = clamp(n, 0, slides.length - 1);
    cur.innerHTML = slides[i].html;
    $('.kshow-n', el).textContent = `${i + 1} / ${slides.length}`;
    $('.kshow-prog i', el).style.transform = `scaleX(${(i + 1) / slides.length})`;
    if (!reduceMotion()) cur.animate([{ opacity: 0, transform: `${cur.style.transform} translateX(${dir * 40}px)` }, { opacity: 1, transform: cur.style.transform }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  let ui;
  const wake = () => { el.classList.add('ui'); clearTimeout(ui); ui = setTimeout(() => el.classList.remove('ui'), 2200); };
  const exit = () => {
    document.removeEventListener('keydown', key, true); window.removeEventListener('resize', fit); document.removeEventListener('fullscreenchange', fsc);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    el.remove(); if (onExit) onExit(i);
  };
  const key = e => {
    e.stopPropagation();
    if (e.key === 'Escape') exit();
    else if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); if (i < slides.length - 1) show(i + 1, 1); else exit(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); show(i - 1, -1); }
  };
  let wasFs = false;
  const fsc = () => { if (document.fullscreenElement) wasFs = true; else if (wasFs) exit(); };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-s]');
    if (b) { if (b.dataset.s === 'x') exit(); else show(i + Number(b.dataset.s), Number(b.dataset.s)); return; }
    if (slideAction(e, exit)) return;
    if (!e.target.closest('a')) { if (i < slides.length - 1) show(i + 1, 1); else exit(); }
  });
  el.addEventListener('pointermove', wake);
  document.addEventListener('keydown', key, true); window.addEventListener('resize', fit); document.addEventListener('fullscreenchange', fsc);
  if (el.requestFullscreen && !isTouch()) el.requestFullscreen().catch(() => {});
  fit(); show(i); wake();
}

/* ==================================================================
   À PROPOS, CV, CORBEILLE
   ================================================================== */
function openAbout(from) {
  const total = CONFIG.projects.length;
  const segs = Object.entries(TYPE).map(([k, t]) => ({ t, n: CONFIG.projects.filter(p => p.type === k).length })).filter(s => s.n);
  WM.open('about', { app: 'finder', kind: 'about', title: '', w: 360, h: 540, noResize: true, cls: 'win-about', from, build: body => {
    body.innerHTML = `<div class="about">
      <div class="ab-logo">${monogram()}</div>
      <h2>${esc(CONFIG.name)}</h2><p class="ab-role">${esc(CONFIG.role)}</p><p class="ab-ver">Portfolio ${new Date().getFullYear()} · version 27.0</p>
      <dl class="ab-specs">
        <div><dt>Puce</dt><dd>Créativité Ultra</dd></div>
        <div><dt>Mémoire</dt><dd>${total} projets</dd></div>
        <div><dt>Spécialités</dt><dd>Vidéo · Motion · Photo</dd></div>
        <div><dt>Basé à</dt><dd>${esc(CONFIG.city)}</dd></div>
      </dl>
      <div class="ab-store"><div class="ab-sh"><b>Stockage</b><span>${total} projets</span></div>
        <div class="sbar">${segs.map(s => `<i style="width:${s.n / total * 100}%;background:${s.t.color}"></i>`).join('')}</div>
        <div class="s-leg">${segs.map(s => `<span><i style="background:${s.t.color}"></i>${s.t.label} (${s.n})</span>`).join('')}</div></div>
      <div class="ab-act"><button class="btn" data-a="pres">Présentation…</button><button class="btn primary" data-a="mail">Me contacter</button></div>
    </div>`;
    body.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'mail') openContact(b.getBoundingClientRect()); else openPresentation(b.getBoundingClientRect()); });
  } });
}
function openCV(from) {
  WM.open('cv', { app: 'finder', kind: 'cv', title: 'CV.pdf', w: 700, h: 760, cls: 'win-preview', from, build: body => {
    body.innerHTML = `<div class="pv">
      <div class="pv-bar"><span class="mono">Page 1 sur 1</span><span class="pv-sp"></span>${CONFIG.cv ? `<a class="btn sm primary" href="${esc(CONFIG.cv)}" download>${G.download} Télécharger le PDF</a>` : `<button class="btn sm" data-print>${G.download} Imprimer / PDF</button>`}</div>
      <div class="pv-scroll"><div class="pv-page">
        <header class="cv-h"><div><h1>${esc(CONFIG.name)}</h1><p>${esc(CONFIG.role)}</p></div><div class="cv-c"><span>${esc(CONFIG.email)}</span>${CONFIG.phone ? `<span>${esc(CONFIG.phone)}</span>` : ''}<span>${esc(CONFIG.city)}</span>${CONFIG.socials.slice(0, 2).map(s => `<span>${esc((SOCIAL[s.network] || {}).label || s.network)} : ${esc(s.handle)}</span>`).join('')}</div></header>
        <section><h4>Profil</h4><p>${esc(CONFIG.bio[0])} ${esc(CONFIG.bio[1] || '')}</p></section>
        <section><h4>Expériences & formation</h4>${CONFIG.path.map(p => `<div class="cv-x"><span>${esc(p.year)}</span><div><b>${esc(p.title)}</b><p>${esc(p.text)}</p></div></div>`).join('')}</section>
        <div class="cv-cols">
          <section><h4>Compétences</h4>${CONFIG.skills.map(s => `<div class="cv-sk"><span>${esc(s.label)}</span><i><b style="width:${s.value}%"></b></i></div>`).join('')}</section>
          <section><h4>Logiciels</h4><div class="cv-tools">${CONFIG.tools.map(t => `<span><i>${toolLogo(t)}</i>${esc(t)}</span>`).join('')}</div><h4>Matériel</h4><ul>${CONFIG.gear.slice(0, 4).map(g => `<li>${esc(g)}</li>`).join('')}</ul></section>
        </div>
        <section><h4>Projets marquants</h4><ul class="cv-pj">${CONFIG.projects.filter(p => p.fav).map(p => `<li><b>${esc(p.title)}</b> — ${esc(p.client)}, ${esc(p.year)}</li>`).join('')}</ul></section>
      </div></div></div>`;
    const pr = $('[data-print]', body); if (pr) pr.addEventListener('click', () => window.print());
  } });
}
function openTrash(from) {
  WM.open('trash', { app: 'trash', kind: 'trash', title: 'Corbeille', w: 460, h: 340, from, build: body => {
    body.innerHTML = `<div class="trash"><div class="tr-ico">${icon('trash')}</div><b>La corbeille est vide</b><p>Ici, on ne garde que les meilleures prises.</p><button class="btn" disabled>Vider la corbeille</button></div>`;
  } });
}

/* ==================================================================
   LANCEMENT
   ================================================================== */
init();
