'use strict';
/* ==================================================================
   PORTFOLIO macOS — core.js
   Le « système » : bureau, widgets, fenêtres, menus, Dock, Spotlight.
   Le contenu est dans config.js, les applications dans apps.js.
   ================================================================== */

/* ==================================================================
   OUTILS
   ================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mq = q => window.matchMedia(q).matches;
const isMobile = () => mq('(max-width: 760px)');
const isTouch = () => mq('(hover: none)');
const reduceMotion = () => mq('(prefers-reduced-motion: reduce)');
const firstName = () => CONFIG.name.split(' ')[0];
const ucfirst = s => s.charAt(0).toUpperCase() + s.slice(1);
const MB = 28; // hauteur de la barre de menus

function durSec(d) { const m = String(d || '').match(/^(\d+):(\d{2})$/); return m ? (+m[1]) * 60 + (+m[2]) : 0; }
const pad = n => String(n).padStart(2, '0');
const mmss = s => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;
const tc = (s, fps = 25) => { s = Math.max(0, s); const f = Math.floor((s % 1) * fps); s = Math.floor(s); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`; };

function rng(seed) {
  let x = 2166136261;
  for (const c of String(seed)) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
  return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hexHue(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16); const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; const d = mx - mn;
  const hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return hh * 60;
}

/* ---------- Médias ---------- */
const asList = v => Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [];
const isVideoFile = s => /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(String(s || ''));
const youtubeId = s => (String(s || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/) || [])[1];
const vimeoId = s => (String(s || '').match(/vimeo\.com\/(?:video\/)?(\d+)/) || [])[1];
function embedURL(url, autoplay) {
  const y = youtubeId(url); if (y) return `https://www.youtube-nocookie.com/embed/${y}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`;
  const v = vimeoId(url); if (v) return `https://player.vimeo.com/video/${v}?dnt=1${autoplay ? '&autoplay=1' : ''}`;
  return '';
}
const iframeHTML = (url, autoplay) => `<iframe src="${esc(embedURL(url, autoplay))}" title="Vidéo" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;

/* ==================================================================
   PICTOGRAMMES D'INTERFACE
   ================================================================== */
const sv = (inner, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const G = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.2-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="1.2" fill="currentColor"/></svg>',
  skipb: sv('<path d="M6 5.5v13"/><path d="M18.5 6v12L9.5 12z" fill="currentColor"/>'),
  skipf: sv('<path d="M18 5.5v13"/><path d="M5.5 6v12l9-6z" fill="currentColor"/>'),
  rew: sv('<path d="M11.5 6.5v11L4 12zM20 6.5v11L12.5 12z" fill="currentColor"/>'),
  ff: sv('<path d="M12.5 6.5v11L20 12zM4 6.5v11l7.5-5.5z" fill="currentColor"/>'),
  back: sv('<path d="M15 6l-6 6 6 6"/>'),
  fwd: sv('<path d="M9 6l6 6-6 6"/>'),
  down: sv('<path d="M6 9.5l6 6 6-6"/>'),
  up: sv('<path d="M6 14.5l6-6 6 6"/>'),
  loop: sv('<path d="M17 3.5l3 3-3 3"/><path d="M4 11.5v-1a4 4 0 0 1 4-4h12M7 20.5l-3-3 3-3"/><path d="M20 12.5v1a4 4 0 0 1-4 4H4"/>'),
  grid: sv('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  list: sv('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".9" fill="currentColor"/><circle cx="4.5" cy="12" r=".9" fill="currentColor"/><circle cx="4.5" cy="18" r=".9" fill="currentColor"/>'),
  gallery: sv('<rect x="3.5" y="4" width="17" height="11" rx="1.5"/><rect x="3.5" y="17" width="4" height="3" rx=".8"/><rect x="10" y="17" width="4" height="3" rx=".8"/><rect x="16.5" y="17" width="4" height="3" rx=".8"/>'),
  search: sv('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  film: sv(GLYPH_PATHS.film), camera: sv(GLYPH_PATHS.camera), sparkle: sv(GLYPH_PATHS.sparkle), briefcase: sv(GLYPH_PATHS.briefcase), cap: sv(GLYPH_PATHS.cap), pencil: sv(GLYPH_PATHS.pencil),
  palette: sv('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.8 0-1 .8-1.7 1.8-1.7h2.1a3.9 3.9 0 0 0 3.9-3.9C20.5 6.4 16.7 3.5 12 3.5z"/><circle cx="7.8" cy="11" r="1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1" fill="currentColor"/><circle cx="15" cy="7.8" r="1" fill="currentColor"/>'),
  heart: sv('<path d="M12 19.5s-7.5-4.4-7.5-9.7A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5c0 5.3-7.5 9.7-7.5 9.7z"/>'),
  user: sv('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.8 3.9-5.8 7.5-5.8s6.7 2 7.5 5.8"/>'),
  mail: sv('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>'),
  send: sv('<path d="M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z"/>'),
  compose: sv('<path d="M11 4.5H6a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h11.5a2 2 0 0 0 2-2v-5"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z"/>'),
  reply: sv('<path d="M10 6L4 11.5l6 5.5"/><path d="M4.5 11.5H14a6 6 0 0 1 6 6v1"/>'),
  replyAll: sv('<path d="M8.5 6L3 11.5 8.5 17"/><path d="M13 6l-6 5.5 6 5.5"/><path d="M7.5 11.5H15a5.5 5.5 0 0 1 5.5 5.5v1.5"/>'),
  forward: sv('<path d="M14 6l6 5.5-6 5.5"/><path d="M19.5 11.5H10a6 6 0 0 0-6 6v1"/>'),
  archive: sv('<rect x="3.5" y="4.5" width="17" height="4.5" rx="1"/><path d="M5 9v9.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4"/>'),
  junk: sv('<rect x="4.5" y="6.5" width="15" height="12" rx="1.5"/><path d="M4.5 7.5l7.5 6 7.5-6M3 3l18 18"/>'),
  flag: sv('<path d="M5.5 21V4.5M5.5 4.5h11l-2 4 2 4h-11"/>'),
  inbox: sv('<path d="M3.5 13l2.5-7.5h12L20.5 13v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/><path d="M3.5 13h5l1.5 2.5h4L15.5 13h5"/>'),
  sentBox: sv('<path d="M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z"/>'),
  doc: sv('<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5"/>'),
  star: sv('<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 15.9l-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z"/>'),
  folder: sv('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
  share: sv('<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7.5 10.5H6A1.5 1.5 0 0 0 4.5 12v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18 10.5h-1.5"/>'),
  tag: sv('<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8" cy="8" r="1.3"/>'),
  more: sv('<circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/>'),
  moreC: sv('<circle cx="12" cy="12" r="8.5"/><circle cx="8" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="16" cy="12" r=".9" fill="currentColor"/>'),
  sidebar: sv('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15"/>'),
  copy: sv('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>'),
  download: sv('<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>'),
  ext: sv('<path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10"/>'),
  eye: sv('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: sv('<path d="M3 3l18 18M10.6 5.6A9 9 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.8 3.6M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.8-.9"/>'),
  close: sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  minus: sv('<path d="M5 12h14"/>'),
  wifi: sv('<path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.7a7.7 7.7 0 0 1 11 0M9.5 15.8a3.5 3.5 0 0 1 5 0"/><circle cx="12" cy="18.6" r="1.1" fill="currentColor" stroke="none"/>'),
  battery: '<svg viewBox="0 0 30 14" aria-hidden="true"><rect x=".75" y=".75" width="25" height="12.5" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.2"/><rect x="2.5" y="2.5" width="21.5" height="9" rx="2.2" fill="currentColor"/><path d="M27.4 5v4c.9-.3 1.4-1 1.4-2s-.5-1.7-1.4-2z" fill="currentColor" fill-opacity=".55"/></svg>',
  cc: sv('<rect x="3.5" y="5" width="17" height="6" rx="3"/><circle cx="17.5" cy="8" r="1.6" fill="currentColor"/><rect x="3.5" y="13" width="17" height="6" rx="3"/><circle cx="6.5" cy="16" r="1.6" fill="currentColor"/>'),
  bt: sv('<path d="M7 7.5l10 9-5 4.5v-18l5 4.5-10 9"/>'),
  airdrop: sv('<circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 1 1 7 0M5.6 18.4a9 9 0 1 1 12.8 0"/>'),
  moon: sv('<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>'),
  contrast: sv('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'),
  sun: sv('<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>'),
  volume: sv('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  image: sv('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-9 8.5"/>'),
  text: sv('<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>'),
  upload: sv('<path d="M12 16V5M7 9.5l5-5 5 5M5 19.5h14"/>'),
  link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  trash: sv('<path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5h9L17.5 7"/>'),
  lock: sv('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  info: sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.8v.2"/>'),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  checklist: sv('<circle cx="6" cy="7" r="2"/><circle cx="6" cy="16" r="2"/><path d="M11 7h9M11 16h9"/>'),
  table: sv('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10M15 9.5v10"/>'),
  chart: sv('<path d="M5 20V11M10 20V5M15 20v-7M20 20V8"/>'),
  shape: sv('<circle cx="9" cy="9" r="5"/><rect x="11" y="11" width="9" height="9" rx="1.5"/>'),
  comment: sv('<path d="M4.5 5.5h15v10h-9l-4.5 4v-4h-1.5z"/>'),
  brush: sv('<path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M6.5 12.5c-2 .5-3 2.5-3 4.5 0 1.5-.5 2.5-1.5 3 3 0 7-1 8-3.5"/>'),
  diamond: sv('<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/>'),
  phone: sv('<path d="M6 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4 5.5a2 2 0 0 1 2-2z"/>'),
  bubble: sv('<path d="M12 4.5c4.7 0 8.5 3 8.5 6.8s-3.8 6.8-8.5 6.8c-1 0-2-.1-2.9-.4L5 19.5l1.2-3.4C4.5 14.9 3.5 13.2 3.5 11.3 3.5 7.5 7.3 4.5 12 4.5z"/>'),
  video: sv('<rect x="3.5" y="6.5" width="12" height="11" rx="2"/><path d="M15.5 10.5l5-3v9l-5-3z"/>'),
  pin: sv('<path d="M12 21s6.5-6.1 6.5-11a6.5 6.5 0 0 0-13 0c0 4.9 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  arrowR: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  clock: sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
  home: sv('<path d="M4 11l8-6.5 8 6.5M6 9.5V19h4.5v-5h3v5H18V9.5"/>'),
  expand: sv('<path d="M14 4.5h5.5V10M10 19.5H4.5V14M19.5 4.5l-6 6M4.5 19.5l6-6"/>'),
  aa: '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="2" y="17.5" font-family="-apple-system,Inter,sans-serif" font-size="15" font-weight="600" fill="currentColor">Aa</text></svg>'
};
const TL_SVG = {
  x: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.6 2.6l4.8 4.8M7.4 2.6L2.6 7.4" stroke="#5a0000" stroke-width="1.3" stroke-linecap="round"/></svg>',
  m: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.2 5h5.6" stroke="#8a4b00" stroke-width="1.4" stroke-linecap="round"/></svg>',
  f: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.4 7.6V3.6l4 4zM7.6 2.4v4l-4-4z" fill="#005e00"/></svg>'
};
const TL_HTML = `<div class="tl"><button class="c" data-act="close" aria-label="Fermer">${TL_SVG.x}</button><button class="m" data-act="min" aria-label="Réduire">${TL_SVG.m}</button><button class="f" data-act="max" aria-label="Agrandir">${TL_SVG.f}</button></div>`;

const monogram = () => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="1.5"/><text x="50" y="51" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system,Inter,system-ui,sans-serif" font-weight="800" font-size="31" fill="currentColor" letter-spacing="-1">${esc(CONFIG.initials)}</text></svg>`;
const avatarHTML = () => CONFIG.avatar ? `<img src="${esc(CONFIG.avatar)}" alt="${esc(CONFIG.name)}">` : `<span>${esc(CONFIG.initials)}</span>`;

/* ==================================================================
   DONNÉES DÉRIVÉES
   ================================================================== */
const TYPE = {
  video:  { label: 'Vidéo', ext: 'mov', glyph: 'film', app: 'resolve', color: '#ff9f0a' },
  motion: { label: 'Motion design', ext: 'aep', glyph: 'sparkle', app: 'ae', color: '#bf5af2' },
  photo:  { label: 'Photo', ext: 'jpg', glyph: 'camera', app: 'lr', color: '#30d158' },
  design: { label: 'Graphisme', ext: 'png', glyph: 'palette', app: 'canva', color: '#0a84ff' }
};
const CAT = { pro: 'Professionnel', scolaire: 'Scolaire', reel: 'Showreel' };
const FMT = { affiche: 'Affiche', miniature: 'Miniature', post: 'Post', story: 'Story' };
const slug = s => norm(s).replace(/[«»"']/g, '').replace(/—/g, '-').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
// logiciel qui ouvre le projet : affiches → Photoshop, autres graphismes → Canva
const appFor = p => p.app || (p.type === 'design' && (p.format || 'affiche') === 'affiche' ? 'ps' : TYPE[p.type].app);
const extFor = p => p.type === 'design' && appFor(p) === 'ps' ? 'psd' : TYPE[p.type].ext;
const fileName = p => p.file || `${ucfirst(slug(p.short || p.title))}.${extFor(p)}`;
const REEL = Object.assign({ id: 'showreel', short: 'Showreel', category: 'reel', type: 'video', client: CONFIG.name, year: '2026', role: 'Réalisation, montage, étalonnage', description: "Une sélection de mes meilleurs plans : clips, aftermovies, films de marque et projets personnels.", tags: ['Showreel'], tools: ['DaVinci Resolve', 'After Effects'], file: 'Showreel.mov', timeline: '' }, CONFIG.showreel);
const byId = id => id === 'showreel' ? REEL : CONFIG.projects.find(p => p.id === id);
const coverOf = p => p.cover || asList(p.gallery)[0] || '';

/* ---------- Affiches générées (projets sans image) ---------- */
function poster(p, o = {}) {
  const { label = true, hue = 0, img } = o;
  const [c1, c2] = p.colors || ['#555', '#222'];
  const src = img !== undefined ? img : coverOf(p);
  if (src && !hue) return `<div class="poster has-img"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></div>`;
  return `<div class="poster" style="--c1:${c1};--c2:${c2};${hue ? `filter:hue-rotate(${hue}deg)` : ''}"><i class="po-orb"></i>${label ? `<span class="po-txt">${esc(p.short || p.title)}</span><span class="po-sub">${esc(p.client || '')}</span>` : ''}</div>`;
}
function wave(seed, n = 60, color = 'currentColor') {
  const r = rng(seed); let d = '';
  for (let i = 0; i < n; i++) {
    const a = (0.25 + r() * 0.75) * (0.55 + 0.45 * Math.abs(Math.sin(i / 5)));
    const hh = Math.max(0.1, a) * 44; const x = i * 2 + 1;
    d += `M${x} ${(25 - hh / 2).toFixed(1)}V${(25 + hh / 2).toFixed(1)}`;
  }
  return `<svg viewBox="0 0 ${n * 2} 50" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" stroke="${color}" stroke-width="1.1" stroke-linecap="round"/></svg>`;
}

/* ==================================================================
   ÉTAT & PRÉFÉRENCES
   ================================================================== */
const WALLPAPERS = { aurore: 'Aurore', lagon: 'Lagon', crepuscule: 'Crépuscule' };
const STATE = { theme: 'dark', wallpaper: 'aurore', dnd: false, launched: new Set(), unlocked: false, welcomed: false, sticky: true };
try {
  const s = JSON.parse(localStorage.getItem('pf-mac') || '{}');
  if (s.theme === 'light' || s.theme === 'dark') STATE.theme = s.theme;
  if (WALLPAPERS[s.wallpaper]) STATE.wallpaper = s.wallpaper;
  if (s.sticky === false) STATE.sticky = false;
} catch (e) { /* stockage indisponible */ }
const savePrefs = () => { try { localStorage.setItem('pf-mac', JSON.stringify({ theme: STATE.theme, wallpaper: STATE.wallpaper, sticky: STATE.sticky })); } catch (e) { /* rien */ } };
function applyTheme() { document.documentElement.dataset.theme = STATE.theme; }
function applyWallpaper() {
  $('#desktop').dataset.wp = STATE.wallpaper;
  if (CONFIG.wallpaper) { const w = $('#wallpaper'); w.classList.add('has-img'); w.style.backgroundImage = `url('${CONFIG.wallpaper}')`; }
}
function toggleTheme() { STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark'; applyTheme(); savePrefs(); syncCC(); }
function setWallpaper(k) { STATE.wallpaper = k; applyWallpaper(); savePrefs(); syncCC(); }
function nextWallpaper() { const k = Object.keys(WALLPAPERS); setWallpaper(k[(k.indexOf(STATE.wallpaper) + 1) % k.length]); }

/* ==================================================================
   NOTIFICATIONS
   ================================================================== */
function notify({ title, body, ic = 'finder', app = 'Portfolio', time = 5500, action }) {
  if (STATE.dnd) return;
  const n = h(`<div class="notif glass" role="status"><div class="n-ico">${icon(ic)}</div><div class="n-txt"><div class="n-head"><b>${esc(app)}</b><span>maintenant</span></div><div class="n-title">${esc(title)}</div><div class="n-body">${esc(body)}</div></div><button class="n-x" aria-label="Fermer">${G.close}</button><i class="n-timer" style="animation-duration:${time}ms"></i></div>`);
  const out = () => { if (n.classList.contains('out')) return; n.classList.add('out'); setTimeout(() => n.remove(), 420); };
  $('.n-timer', n).addEventListener('animationend', out);
  $('.n-x', n).addEventListener('click', e => { e.stopPropagation(); out(); });
  n.addEventListener('click', () => { if (action) action(); out(); });
  $('#notifs').prepend(n);
  const all = $$('.notif', $('#notifs')); if (all.length > 3) all.slice(3).forEach(x => x.remove());
}

/* ==================================================================
   MENUS (barre de menus + clic droit)
   ================================================================== */
let openMenu = null;
function closeMenus() {
  if (!openMenu) return;
  const m = openMenu; openMenu = null;
  if (m.anchor) m.anchor.classList.remove('open');
  m.el.classList.add('out'); setTimeout(() => m.el.remove(), 140);
}
function showMenu(items, x, y, anchor, key) {
  closeMenus();
  const m = h('<div class="menu glass" role="menu"></div>');
  items.forEach(it => {
    if (it === '-') { m.append(h('<div class="menu-sep"></div>')); return; }
    const row = h(`<div class="menu-item ${it.disabled ? 'disabled' : ''}" role="menuitem"><span class="mi-l"><i class="mi-check">${it.check ? '✓' : ''}</i>${esc(it.label)}</span>${it.kbd ? `<kbd>${it.kbd}</kbd>` : ''}</div>`);
    row.addEventListener('click', () => { closeMenus(); if (it.action) it.action(); });
    m.append(row);
  });
  $('#desktop').append(m);
  const r = m.getBoundingClientRect();
  m.style.left = clamp(x, 6, innerWidth - r.width - 6) + 'px';
  m.style.top = clamp(y, MB, innerHeight - r.height - 6) + 'px';
  openMenu = { el: m, anchor, key };
  if (anchor) anchor.classList.add('open');
}
document.addEventListener('pointerdown', e => {
  if (openMenu && !openMenu.el.contains(e.target) && !(openMenu.anchor && openMenu.anchor.contains(e.target))) closeMenus();
  const cc = $('#cc');
  if (cc && cc.classList.contains('open') && !cc.contains(e.target) && !e.target.closest('[data-mb="cc"]')) toggleCC(false);
}, true);

const MENUS = {
  brand: () => [
    { label: 'À propos de ce portfolio', action: () => openAbout() },
    '-',
    { label: 'Mode sombre', check: STATE.theme === 'dark', action: toggleTheme },
    { label: 'Fond d\'écran suivant', action: nextWallpaper },
    { label: 'Centre de contrôle…', action: () => toggleCC(true) },
    { label: 'Rechercher…', kbd: '⌘K', action: openSpotlight },
    '-',
    { label: 'Verrouiller l\'écran', action: lockScreen },
    { label: 'Redémarrer…', action: restart }
  ],
  file: () => [
    { label: 'Nouvelle fenêtre Finder', action: () => openFolder('all', null, true) },
    { label: 'Ouvrir le showreel', action: () => openShowreel() },
    { label: 'Ouvrir les storyboards', action: () => openNotes('folder:storyboards') },
    { label: 'Voir le CV', action: () => openCV() },
    '-',
    { label: 'Fermer la fenêtre', kbd: '⌘W', disabled: !WM.focused, action: () => WM.close(WM.focused) }
  ],
  window: () => {
    const wins = [...WM.list.values()];
    return [
      { label: 'Réduire', kbd: '⌘M', disabled: !WM.focused, action: () => WM.minimize(WM.focused) },
      { label: 'Agrandir', disabled: !WM.focused, action: () => WM.toggleMax(WM.focused) },
      { label: 'Tout fermer', disabled: !wins.length, action: () => WM.closeAll() },
      ...(wins.length ? ['-'] : []),
      ...wins.map(r => ({ label: r.title, check: r.id === WM.focused, action: () => (r.minimized ? WM.restore(r.id) : WM.focus(r.id)) }))
    ];
  },
  help: () => [
    { label: 'Comment naviguer ?', action: showHelp },
    { label: 'Me contacter', action: () => openContact() },
    { label: 'Copier mon adresse e-mail', action: copyEmail }
  ]
};
function showHelp() {
  notify({ title: 'Comment naviguer ?', body: 'Double-clique sur les dossiers du bureau ou ouvre une app dans le Dock. « Présentation » en haut pour me découvrir, ⌘K (ou Ctrl+K) pour chercher.', ic: 'notes', app: 'Aide', time: 8000 });
}
function copyEmail() {
  const done = () => notify({ title: 'Adresse copiée', body: CONFIG.email, ic: 'mail', app: 'Mail', time: 3500 });
  if (navigator.clipboard) navigator.clipboard.writeText(CONFIG.email).then(done, () => window.prompt('Adresse e-mail :', CONFIG.email));
  else window.prompt('Adresse e-mail :', CONFIG.email);
}

/* ==================================================================
   BARRE DE MENUS
   ================================================================== */
function buildMenubar() {
  const mb = $('#menubar');
  mb.innerHTML = `
    <div class="mb-left">
      <button class="mb-item mb-brand" data-mb="brand" aria-label="Menu principal">${monogram()}</button>
      <button class="mb-item mb-app" data-mb="file" id="mbApp">Finder</button>
      <button class="mb-item mb-menu" data-mb="file">Fichier</button>
      <button class="mb-item mb-page" data-go="presentation">Présentation</button>
      <button class="mb-item mb-page" data-go="contact">Contact</button>
      <button class="mb-item mb-menu" data-mb="window">Fenêtre</button>
      <button class="mb-item mb-menu" data-mb="help">Aide</button>
    </div>
    <div class="mb-right">
      <span class="mb-item mb-rec mb-hide" title="Toujours en train de filmer"><i></i>REC</span>
      <span class="mb-item mb-batt mb-hide" aria-label="Batterie">100 %${G.battery}</span>
      <span class="mb-item mb-ic mb-hide" aria-label="Wi-Fi">${G.wifi}</span>
      <button class="mb-item mb-ic" data-mb="search" aria-label="Rechercher">${G.search}</button>
      <button class="mb-item mb-ic" data-mb="cc" aria-label="Centre de contrôle">${G.cc}</button>
      <span class="mb-item mb-clock" id="mbClock"></span>
    </div>`;
  mb.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { closeMenus(); toggleCC(false); if (go.dataset.go === 'presentation') openPresentation(); else openContact(); return; }
    const b = e.target.closest('[data-mb]'); if (!b) return;
    const k = b.dataset.mb;
    if (k === 'search') { openSpotlight(); return; }
    if (k === 'cc') { toggleCC(); return; }
    if (openMenu && openMenu.anchor === b) { closeMenus(); return; }
    const r = b.getBoundingClientRect(); showMenu(MENUS[k](), r.left, MB + 3, b, k);
  });
  mb.addEventListener('mouseover', e => {
    const b = e.target.closest('[data-mb]');
    if (!b || !openMenu || !openMenu.anchor || openMenu.anchor === b || !MENUS[b.dataset.mb]) return;
    const r = b.getBoundingClientRect(); showMenu(MENUS[b.dataset.mb](), r.left, MB + 3, b, b.dataset.mb);
  });
}
function updateMenubar() {
  const r = WM.focused && WM.list.get(WM.focused);
  const el = $('#mbApp'); if (el) el.textContent = r ? (APPS[r.app] || APPS.finder).name : 'Finder';
  $$('.mb-page').forEach(b => b.classList.toggle('active', !!r && ((b.dataset.go === 'presentation' && r.app === 'keynote') || (b.dataset.go === 'contact' && r.app === 'contacts'))));
}
function tickClock() {
  const d = new Date();
  const date = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const c = $('#mbClock'); if (c) c.textContent = `${ucfirst(date)}  ${time}`;
  $('#lockTime').textContent = time;
  $('#lockDate').textContent = ucfirst(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
}

/* ==================================================================
   CENTRE DE CONTRÔLE
   ================================================================== */
function buildCC() {
  const cc = h(`<div class="cc glass" id="cc" role="dialog" aria-label="Centre de contrôle">
    <div class="cc-row">
      <div class="cc-tile cc-net">
        <button class="cc-round on" data-cc="wifi">${G.wifi}<span><b>Wi-Fi</b><small>Studio_5G</small></span></button>
        <button class="cc-round on" data-cc="bt">${G.bt}<span><b>Bluetooth</b><small>Activé</small></span></button>
        <button class="cc-round" data-cc="air">${G.airdrop}<span><b>AirDrop</b><small>Contacts</small></span></button>
      </div>
      <div class="cc-col">
        <button class="cc-tile cc-toggle" data-cc="theme"><span class="cc-ic">${G.contrast}</span><b>Mode sombre</b></button>
        <button class="cc-tile cc-toggle" data-cc="dnd"><span class="cc-ic">${G.moon}</span><b>Ne pas déranger</b></button>
      </div>
    </div>
    <div class="cc-tile cc-slider"><b>Luminosité</b><label class="slider">${G.sun}<input type="range" min="35" max="100" value="100" data-cc="bright" aria-label="Luminosité"></label></div>
    <div class="cc-tile cc-wp"><b>Fond d'écran</b><div class="cc-swatches">${Object.entries(WALLPAPERS).map(([k, l]) => `<button class="sw sw-${k}" data-wp="${k}" aria-label="${l}"><span>${l}</span></button>`).join('')}</div></div>
    <div class="cc-tile cc-now"><div class="cc-art">${poster(REEL, { label: false })}</div><div class="cc-nowt"><b>${esc(REEL.title)}</b><small>${esc(CONFIG.name)}</small></div><button class="cc-play" data-cc="reel" aria-label="Lire le showreel">${G.play}</button></div>
  </div>`);
  $('#desktop').append(cc);
  cc.addEventListener('click', e => {
    const b = e.target.closest('[data-cc]'); const w = e.target.closest('[data-wp]');
    if (w) { setWallpaper(w.dataset.wp); return; }
    if (!b) return;
    const k = b.dataset.cc;
    if (k === 'theme') toggleTheme();
    else if (k === 'dnd') { STATE.dnd = !STATE.dnd; syncCC(); }
    else if (k === 'reel') { toggleCC(false); openShowreel(b.getBoundingClientRect()); }
    else if (k !== 'bright') b.classList.toggle('on');
  });
  $('[data-cc="bright"]', cc).addEventListener('input', e => { $('#dim').style.opacity = ((100 - e.target.value) / 100 * 0.9).toFixed(2); });
  syncCC();
}
function syncCC() {
  const cc = $('#cc'); if (!cc) return;
  $('[data-cc="theme"]', cc).classList.toggle('on', STATE.theme === 'dark');
  $('[data-cc="dnd"]', cc).classList.toggle('on', STATE.dnd);
  $$('[data-wp]', cc).forEach(b => b.classList.toggle('on', b.dataset.wp === STATE.wallpaper));
}
function toggleCC(force) {
  const cc = $('#cc'); if (!cc) return;
  const open = force ?? !cc.classList.contains('open');
  closeMenus(); cc.classList.toggle('open', open);
  const b = $('[data-mb="cc"]'); if (b) b.classList.toggle('open', open);
}

/* ==================================================================
   GESTIONNAIRE DE FENÊTRES
   - déplacement en « transform » (calculé par la carte graphique)
   - pas de flou d'arrière-plan sur les fenêtres (c'était la cause des ralentissements)
   ================================================================== */
function workArea() {
  const dock = $('#dock'); const dh = dock ? dock.offsetHeight + 16 : 90;
  return { x: 0, y: MB, w: innerWidth, h: innerHeight - MB - dh };
}
const NODRAG = 'button, input, textarea, select, a, label, [data-nodrag], .tl';
const WM = {
  z: 200, cascade: 0, list: new Map(), focused: null,

  open(id, o) {
    const ex = this.list.get(id);
    if (ex) {
      if (ex.minimized) this.restore(id);
      else { this.focus(id); ex.el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.01)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' }); }
      if (o.reuse) o.reuse(ex);
      return ex;
    }
    const A = workArea();
    const w = Math.min(o.w || 760, A.w - 24), hh = Math.min(o.h || 500, A.h - 12);
    const off = (this.cascade++ % 6) * 24;
    let x = Math.round((A.w - w) / 2 + off - 50), y = Math.round(A.y + Math.max(6, (A.h - hh) / 2 - 20) + off * 0.6);
    x = clamp(x, 8, Math.max(8, A.w - w - 8)); y = clamp(y, A.y + 6, Math.max(A.y + 6, A.y + A.h - hh));
    const chrome = o.chrome || 'title';

    const el = h(`<section class="win ${o.cls || ''} chrome-${chrome}" data-id="${esc(id)}" role="dialog" aria-label="${esc(o.title)}">
      ${chrome === 'none' ? '' : `<header class="win-titlebar" data-drag>${TL_HTML}<div class="win-title">${esc(o.title)}</div></header>`}
      <div class="win-body"></div>
      ${o.noResize ? '' : '<div class="win-resize" aria-hidden="true"></div>'}
    </section>`);
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' });
    if (o.minW) el.dataset.minw = o.minW;
    $('#windows').append(el);

    const rec = { id, el, app: o.app, kind: o.kind, title: o.title, minimized: false, max: false, body: $('.win-body', el), state: {}, onclose: null, onhide: null, onshow: null };
    rec.setTitle = t => { rec.title = t; const tt = $('.win-title', el); if (tt) tt.textContent = t; el.setAttribute('aria-label', t); updateMenubar(); };
    this.list.set(id, rec);

    if (o.build) o.build(rec.body, rec);
    $$('.tl-slot', el).forEach(slot => { slot.innerHTML = TL_HTML; });
    this.wire(rec);
    this.focus(rec.id);
    this.animateOpen(el, o.from);
    updateDock();
    return rec;
  },

  wire(rec) {
    const el = rec.el;
    el.addEventListener('pointerdown', () => this.focus(rec.id), true);
    el.addEventListener('click', e => {
      const b = e.target.closest('.tl [data-act]'); if (!b || !el.contains(b)) return; e.stopPropagation();
      ({ close: () => this.close(rec.id), min: () => this.minimize(rec.id), max: () => this.toggleMax(rec.id) })[b.dataset.act]();
    });
    el.addEventListener('dblclick', e => { const d = e.target.closest('[data-drag]'); if (d && !e.target.closest(NODRAG)) this.toggleMax(rec.id); });
    el.addEventListener('pointerdown', e => {
      const bar = e.target.closest('[data-drag]');
      if (!bar || e.button !== 0 || e.target.closest(NODRAG) || isMobile() || rec.max) return;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop, ow = el.offsetWidth;
      let dx = 0, dy = 0, raf = 0;
      bar.setPointerCapture(e.pointerId); el.classList.add('dragging');
      const paint = () => { raf = 0; el.style.transform = `translate3d(${dx}px,${dy}px,0)`; };
      const mv = ev => {
        dx = clamp(ox + ev.clientX - sx, 60 - ow, innerWidth - 60) - ox;
        dy = clamp(oy + ev.clientY - sy, MB, innerHeight - 50) - oy;
        if (!raf) raf = requestAnimationFrame(paint);
      };
      const up = () => {
        cancelAnimationFrame(raf); el.classList.remove('dragging');
        el.style.transform = ''; el.style.left = (ox + dx) + 'px'; el.style.top = (oy + dy) + 'px';
        bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up);
      };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });
    const rz = $('.win-resize', el);
    if (rz) rz.addEventListener('pointerdown', e => {
      e.stopPropagation(); const sx = e.clientX, sy = e.clientY, ow = el.offsetWidth, oh = el.offsetHeight;
      const minw = +(el.dataset.minw || 380); let w = ow, hh = oh, raf = 0;
      rz.setPointerCapture(e.pointerId); el.classList.add('resizing');
      const paint = () => { raf = 0; el.style.width = w + 'px'; el.style.height = hh + 'px'; };
      const mv = ev => { w = Math.max(minw, ow + ev.clientX - sx); hh = Math.max(260, oh + ev.clientY - sy); if (!raf) raf = requestAnimationFrame(paint); };
      const up = () => { el.classList.remove('resizing'); rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up); window.dispatchEvent(new Event('winresize')); };
      rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up);
    });
  },

  animateOpen(el, from) {
    if (reduceMotion()) return;
    const r = el.getBoundingClientRect();
    let kf;
    if (from && !isMobile()) {
      const fx = from.left + from.width / 2 - (r.left + r.width / 2), fy = from.top + from.height / 2 - (r.top + r.height / 2);
      const s = clamp(from.width / r.width, 0.05, 0.3);
      kf = [{ transform: `translate(${fx}px,${fy}px) scale(${s})`, opacity: 0 }, { transform: 'none', opacity: 1 }];
    } else kf = [{ transform: 'translateY(14px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    el.animate(kf, { duration: from ? 420 : 300, easing: 'cubic-bezier(.22,1,.36,1)' });
  },

  focus(id) {
    if (!this.list.has(id)) return;
    const rec = this.list.get(id);
    if (this.focused !== id || rec.el.style.zIndex === '') rec.el.style.zIndex = ++this.z;
    if (this.focused !== id) {
      this.focused = id;
      this.list.forEach(r => r.el.classList.toggle('focused', r.id === id));
      updateMenubar();
    }
  },
  blur() { this.focused = null; this.list.forEach(r => r.el.classList.remove('focused')); updateMenubar(); },
  focusTop() {
    const vis = [...this.list.values()].filter(r => !r.minimized).sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex));
    if (vis.length) { this.focused = null; this.focus(vis[0].id); } else this.blur();
  },

  close(id) {
    const rec = this.list.get(id); if (!rec) return;
    if (rec.onclose) rec.onclose();
    this.list.delete(id);
    const a = rec.el.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.95)', opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = () => rec.el.remove();
    if (this.focused === id) { this.focused = null; this.focusTop(); }
    updateDock();
  },
  closeAll() { [...this.list.keys()].forEach(id => this.close(id)); },

  minimize(id) {
    const rec = this.list.get(id); if (!rec || rec.minimized) return;
    if (rec.onhide) rec.onhide();
    const t = dockRect(rec.app); const r = rec.el.getBoundingClientRect();
    const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height / 2);
    rec.minimized = true;
    const a = rec.el.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(.05)`, opacity: 0 }
    ], { duration: reduceMotion() ? 1 : 420, easing: 'cubic-bezier(.55,0,.75,.2)' });
    a.onfinish = () => rec.el.classList.add('hidden');
    if (this.focused === id) { this.focused = null; setTimeout(() => this.focusTop(), 10); }
    updateDock();
  },
  restore(id) {
    const rec = this.list.get(id); if (!rec) return;
    rec.el.classList.remove('hidden'); rec.minimized = false;
    const t = dockRect(rec.app); const r = rec.el.getBoundingClientRect();
    const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height / 2);
    rec.el.animate([{ transform: `translate(${dx}px,${dy}px) scale(.05)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduceMotion() ? 1 : 400, easing: 'cubic-bezier(.22,1,.36,1)' });
    if (rec.onshow) rec.onshow();
    this.focused = null; this.focus(id); updateDock();
  },
  toggleMax(id) {
    const rec = this.list.get(id); if (!rec || isMobile()) return;
    const el = rec.el; el.classList.add('anim-geom');
    if (!rec.max) {
      rec.prev = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
      const A = workArea();
      Object.assign(el.style, { left: '6px', top: (MB + 5) + 'px', width: (A.w - 12) + 'px', height: (A.h - 4) + 'px' });
      rec.max = true; el.classList.add('maxed');
    } else { Object.assign(el.style, rec.prev); rec.max = false; el.classList.remove('maxed'); }
    setTimeout(() => { el.classList.remove('anim-geom'); window.dispatchEvent(new Event('winresize')); }, 420);
  },
  rekey(oldId, newId) {
    const rec = this.list.get(oldId); if (!rec) return;
    this.list.delete(oldId); rec.id = newId; rec.el.dataset.id = newId; this.list.set(newId, rec);
    if (this.focused === oldId) this.focused = newId;
  }
};

/* ==================================================================
   APPLICATIONS (les fenêtres sont construites dans apps.js)
   ================================================================== */
const APPS = {
  finder:   { name: 'Finder', icon: 'finder', open: from => openFolder('all', from) },
  keynote:  { name: 'Keynote', icon: 'keynote', open: from => openPresentation(from) },
  resolve:  { name: 'DaVinci Resolve', icon: 'resolve', splash: 'resolve', open: from => openResolve(null, from),
              status: ['Chargement des préférences…', 'Initialisation du moteur GPU…', 'Chargement des plug-ins…', 'Ouverture du projet…'] },
  ae:       { name: 'After Effects', icon: 'ae', splash: 'adobe', open: from => openAE(null, from),
              status: ['Initialisation des plug-ins…', 'Chargement des effets…', 'Ouverture des compositions…'] },
  lr:       { name: 'Lightroom Classic', icon: 'lrc', splash: 'adobe', open: from => openLR(null, from),
              status: ['Ouverture du catalogue…', 'Chargement des aperçus…', 'Préparation du module Développement…'] },
  ps:       { name: 'Photoshop', icon: 'ps', splash: 'adobe', open: from => openPS(null, from),
              status: ['Lecture des préférences…', 'Chargement des pinceaux…', 'Ouverture des documents…'] },
  canva:    { name: 'Canva', icon: 'canva', splash: 'canva', open: from => openCanva(null, from),
              status: ['Connexion à l\'espace de travail…', 'Chargement des designs…'] },
  notes:    { name: 'Notes', icon: 'notes', open: from => openNotes(null, from) },
  mail:     { name: 'Mail', icon: 'mail', open: from => openMail(from) },
  contacts: { name: 'Contacts', icon: 'contacts', open: from => openContact(from) },
  trash:    { name: 'Corbeille', icon: 'trash', open: from => openTrash(from) }
};
const DOCK = ['finder', 'keynote', '|', 'resolve', 'ae', 'lr', 'ps', 'canva', '|', 'notes', 'mail', 'contacts', '|', 'trash'];

function dockItem(app) { return $(`.dock-item[data-app="${app}"]`); }
function dockRect(app) {
  const d = dockItem(app) || dockItem('finder');
  return d ? d.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight, width: 0, height: 0 };
}
function updateDock() {
  const running = new Set([...WM.list.values()].map(r => r.app));
  $$('.dock-item').forEach(d => d.classList.toggle('running', running.has(d.dataset.app)));
}

/* écran de démarrage propre à chaque logiciel */
function splash(appId) {
  const app = APPS[appId];
  return new Promise(res => {
    const year = new Date().getFullYear();
    const names = { resolve: 'DaVinci Resolve 19', ae: `Adobe After Effects ${year}`, ps: `Adobe Photoshop ${year}`, lr: 'Adobe Lightroom Classic', canva: 'Canva' };
    const el = h(`<div class="splash sp-${app.splash} sp-${appId}"><div class="sp-art"></div><div class="sp-logo">${icon(app.icon)}</div>
      <div class="sp-name">${esc(names[appId] || app.name)}</div><div class="sp-status">Démarrage…</div><div class="sp-bar"><i></i></div>
      <div class="sp-legal">${app.splash === 'adobe' ? '© 1990-' + year + ' Adobe. Tous droits réservés.' : app.splash === 'resolve' ? 'Blackmagic Design' : ''}</div></div>`);
    $('#desktop').append(el);
    const fill = $('.sp-bar i', el), st = $('.sp-status', el);
    let p = 0;
    const tick = () => {
      p = Math.min(100, p + 14 + Math.random() * 18);
      fill.style.transform = `scaleX(${p / 100})`;
      st.textContent = app.status[Math.min(app.status.length - 1, Math.floor(p / 100 * app.status.length))];
      if (p < 100) setTimeout(tick, 110 + Math.random() * 90);
      else setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); res(); }, 180);
    };
    setTimeout(tick, 200);
  });
}
async function ensureLaunched(appId) {
  const app = APPS[appId]; if (!app) return;
  const di = dockItem(appId);
  if (app.splash && !STATE.launched.has(appId) && ![...WM.list.values()].some(r => r.app === appId)) {
    STATE.launched.add(appId);
    if (di) di.classList.add('bounce');
    await splash(appId);
    if (di) di.classList.remove('bounce');
  } else if (di && ![...WM.list.values()].some(r => r.app === appId)) { di.classList.add('bounce'); setTimeout(() => di.classList.remove('bounce'), 650); }
}
async function launch(appId, from) {
  const app = APPS[appId]; if (!app) return;
  const mine = [...WM.list.values()].filter(r => r.app === appId);
  if (mine.length) {
    const min = mine.filter(r => r.minimized);
    if (min.length) min.forEach(r => WM.restore(r.id));
    else WM.focus(mine.sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex))[0].id);
    return;
  }
  await ensureLaunched(appId);
  const di = dockItem(appId);
  app.open(from || (di ? $('.ico', di).getBoundingClientRect() : null));
}

/* ==================================================================
   DOCK (grossissement limité à une image par rafraîchissement)
   ================================================================== */
function buildDock() {
  const dock = $('#dock');
  dock.innerHTML = DOCK.map(a => a === '|' ? '<span class="dock-sep" aria-hidden="true"></span>'
    : `<button class="dock-item" data-app="${a}" aria-label="${esc(APPS[a].name)}"><span class="ico">${icon(APPS[a].icon)}</span><span class="tip">${esc(APPS[a].name)}</span><i class="dot"></i></button>`).join('');
  dock.addEventListener('click', e => { const b = e.target.closest('.dock-item'); if (b) launch(b.dataset.app); });
  const items = $$('.dock-item', dock);
  let mx = null, raf = 0, centers = [];
  const measure = () => { centers = items.map(it => { const r = it.getBoundingClientRect(); return r.left + r.width / 2; }); };
  const paint = () => {
    raf = 0;
    items.forEach((it, i) => {
      const d = mx === null ? 999 : Math.abs(mx - centers[i]);
      const k = Math.max(0, Math.cos(Math.min(d / 140, 1) * Math.PI / 2));
      it.style.setProperty('--s', (50 + 26 * k).toFixed(1) + 'px');
    });
  };
  dock.addEventListener('pointerenter', e => { if (e.pointerType === 'touch' || isTouch() || isMobile()) return; measure(); });
  dock.addEventListener('pointermove', e => {
    if (isTouch() || isMobile() || e.pointerType === 'touch') return;
    if (!centers.length) measure();
    mx = e.clientX; if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  dock.addEventListener('pointerleave', () => { mx = null; centers = []; cancelAnimationFrame(raf); raf = 0; items.forEach(it => it.style.removeProperty('--s')); });
}

/* ==================================================================
   BUREAU — icônes
   ================================================================== */
const DESK = [
  { id: 'pro', label: 'Projets pro', icon: 'folderPro', open: f => openFolder('pro', f) },
  { id: 'sco', label: 'Projets scolaires', icon: 'folderSchool', open: f => openFolder('scolaire', f) },
  { id: 'photos', label: 'Photos', icon: 'folderPhoto', open: f => openFolder('photo', f) },
  { id: 'motion', label: 'Motion design', icon: 'folderMotion', open: f => openFolder('motion', f) },
  { id: 'story', label: 'Storyboards', icon: 'folderStory', open: f => openNotes('folder:storyboards', f) },
  { id: 'reel', label: 'Showreel.mov', icon: 'mov', open: f => openShowreel(f) },
  { id: 'pres', label: 'Présentation.key', icon: 'key', open: f => openPresentation(f) },
  { id: 'cv', label: 'CV.pdf', icon: 'pdf', open: f => openCV(f) },
  { id: 'contact', label: 'Contact.vcf', icon: 'vcf', open: f => openContact(f) }
];
function buildDesk() {
  const wrap = $('#deskIcons');
  wrap.innerHTML = '';
  DESK.forEach((d, i) => {
    d.el = h(`<div class="dicon" data-id="${d.id}" tabindex="0" role="button" aria-label="Ouvrir ${esc(d.label)}" style="--i:${i}"><div class="ico">${icon(d.icon)}</div><span class="lbl">${esc(d.label)}</span></div>`);
    wrap.append(d.el);
  });
  layoutDesk(true);
  wrap.addEventListener('pointerdown', deskDown);
  wrap.addEventListener('dblclick', e => { const el = e.target.closest('.dicon'); if (el) openDesk(el); });
  wrap.addEventListener('keydown', e => { if (e.key === 'Enter') { const el = e.target.closest('.dicon'); if (el) openDesk(el); } });
  $('#desktop').addEventListener('contextmenu', e => {
    if (!e.target.closest('#deskIcons, .wallpaper, .widgets')) return;
    e.preventDefault();
    showMenu([
      { label: 'Présentation', action: () => openPresentation() },
      { label: 'Me contacter', action: () => openContact() },
      '-',
      { label: 'Ouvrir tous les projets', action: () => openFolder('all') },
      { label: 'Rechercher…', kbd: '⌘K', action: openSpotlight },
      '-',
      { label: 'Changer le fond d\'écran', action: nextWallpaper },
      { label: STATE.theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre', action: toggleTheme },
      { label: 'Ranger le bureau', action: () => { DESK.forEach(d => { d.moved = false; }); layoutDesk(true); } },
      ...(STATE.sticky ? [] : [{ label: 'Afficher le pense-bête', action: () => { STATE.sticky = true; savePrefs(); buildSticky(); } }]),
      '-',
      { label: 'À propos de ce portfolio', action: () => openAbout() }
    ], e.clientX, e.clientY);
  });
}
function layoutDesk(force) {
  const mob = isMobile();
  const top = mob ? (($('#widgets') || {}).offsetHeight || 0) + 14 : 10;
  const perCol = Math.max(1, Math.floor((innerHeight - MB - 110 - top) / 100));
  const cols = Math.max(1, Math.floor((innerWidth - 12) / 86));
  DESK.forEach((d, i) => {
    if (d.moved && !mob && !force) return;
    let x, y;
    if (mob) { x = 6 + (i % cols) * 86; y = top + Math.floor(i / cols) * 98; }
    else { const col = Math.floor(i / perCol), row = i % perCol; x = innerWidth - 122 - col * 110; y = top + row * 100; }
    d.el.style.left = x + 'px'; d.el.style.top = y + 'px';
  });
}
function openDesk(el) {
  const d = DESK.find(x => x.el === el); if (!d) return;
  el.classList.remove('launch'); void el.offsetWidth; el.classList.add('launch');
  d.open($('.ico', el).getBoundingClientRect());
}
const clearSel = () => DESK.forEach(d => d.el.classList.remove('selected'));
function deskDown(e) {
  if (e.button !== 0) return;
  const wrap = $('#deskIcons'); const el = e.target.closest('.dicon');
  if (el) {
    if (!el.classList.contains('selected') && !(e.shiftKey || e.metaKey || e.ctrlKey)) clearSel();
    el.classList.add('selected');
    const sx = e.clientX, sy = e.clientY;
    const origin = DESK.filter(d => d.el.classList.contains('selected')).map(d => ({ d, x: d.el.offsetLeft, y: d.el.offsetTop }));
    let moved = false, dx = 0, dy = 0, raf = 0;
    el.setPointerCapture(e.pointerId);
    const paint = () => { raf = 0; origin.forEach(o => { o.d.el.style.transform = `translate3d(${dx}px,${dy}px,0)`; }); };
    const mv = ev => {
      dx = ev.clientX - sx; dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!moved) { moved = true; origin.forEach(o => o.d.el.classList.add('dragging')); }
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const up = ev => {
      el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      cancelAnimationFrame(raf);
      origin.forEach(o => {
        o.d.el.classList.remove('dragging'); o.d.el.style.transform = '';
        if (moved) { o.d.el.style.left = clamp(o.x + dx, 0, innerWidth - 100) + 'px'; o.d.el.style.top = clamp(o.y + dy, 0, innerHeight - 200) + 'px'; o.d.moved = true; }
      });
      if (!moved && ev.type === 'pointerup' && (ev.pointerType === 'touch' || isTouch())) openDesk(el);
    };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return;
  }
  clearSel(); WM.blur();
  if (e.pointerType === 'touch') return;
  const rect = $('#selectRect'); const sx = e.clientX, sy = e.clientY;
  const boxes = DESK.map(d => ({ d, r: d.el.getBoundingClientRect() }));
  let raf = 0, last = null;
  wrap.setPointerCapture(e.pointerId);
  const paint = () => {
    raf = 0; const ev = last;
    const x = Math.min(sx, ev.clientX), y = Math.max(MB, Math.min(sy, ev.clientY)), w = Math.abs(ev.clientX - sx), hh = Math.abs(ev.clientY - sy);
    Object.assign(rect.style, { display: 'block', left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' });
    boxes.forEach(({ d, r }) => d.el.classList.toggle('selected', r.left < x + w && r.right > x && r.top < y + hh && r.bottom > y));
  };
  const mv = ev => { last = ev; if (!raf) raf = requestAnimationFrame(paint); };
  const up = () => { cancelAnimationFrame(raf); rect.style.display = 'none'; wrap.removeEventListener('pointermove', mv); wrap.removeEventListener('pointerup', up); };
  wrap.addEventListener('pointermove', mv); wrap.addEventListener('pointerup', up);
}

/* ==================================================================
   BUREAU — widgets (pour que le bureau ne soit plus vide)
   ================================================================== */
let photoCycle = { list: [], i: 0, timer: 0 };
function buildWidgets() {
  const wrap = $('#widgets');
  const d = new Date();
  const favs = CONFIG.projects.filter(p => p.fav);
  const photos = (favs.length ? favs : CONFIG.projects).slice(0, 5);
  const sb = CONFIG.storyboards || [];
  const reelVid = isVideoFile(REEL.video) && !isMobile() && !reduceMotion();
  const cal = calendarHTML(d);
  wrap.innerHTML = `
    <div class="wg wg-m wg-prof" style="--i:0">
      <div class="wp-top"><span class="wp-av">${avatarHTML()}</span><div class="wp-id"><b>${esc(CONFIG.name)}</b><span>${esc(CONFIG.role)}</span><small>${G.pin}${esc(CONFIG.city)}</small></div></div>
      <div class="wp-status"><i></i><span>${esc(CONFIG.status)}</span></div>
      <div class="wp-act"><button class="wp-btn" data-w="pres"><span class="wp-ic">${icon('keynote')}</span>Présentation</button><button class="wp-btn primary" data-w="contact">${G.send}Me contacter</button></div>
    </div>
    <button class="wg wg-m wg-reel" data-w="reel" style="--i:1" aria-label="Lire le showreel">
      <div class="wr-media">${reelVid ? `<video src="${esc(REEL.video)}" muted loop playsinline autoplay preload="metadata"></video>` : poster(REEL, { label: false })}</div>
      <div class="wr-over"><span class="wr-kicker">${G.film}SHOWREEL</span><b>${esc(REEL.title)}</b><small>${esc(REEL.duration)} · ${esc(CONFIG.role)}</small></div>
      <span class="wr-play">${G.play}</span>
    </button>
    <div class="wg wg-s wg-clock" style="--i:2">${clockHTML(d)}<span class="wc-city">${esc(CONFIG.city.split(',')[0])}</span></div>
    <div class="wg wg-s wg-cal" style="--i:3">${cal}</div>
    <button class="wg wg-s wg-photos" data-w="photo" style="--i:4" aria-label="Voir les projets">
      ${photos.map((p, i) => `<div class="wph-slide ${i === 0 ? 'on' : ''}">${poster(p, { label: false })}</div>`).join('')}
      <span class="wph-tag">${G.heart}Coups de cœur</span>
    </button>
    <button class="wg wg-s wg-notes" data-w="story" style="--i:5" aria-label="Ouvrir les storyboards">
      <div class="wn-h"><span class="wn-ico">${icon('notes')}</span><b>Storyboards</b></div>
      <div class="wn-b"><b>${esc(sb[0] ? sb[0].title : 'Mes storyboards')}</b><small>${esc(sb[0] ? sb[0].description : 'Ajoute tes planches dans config.js')}</small></div>
      <div class="wn-f">${sb.length} storyboard${sb.length > 1 ? 's' : ''}</div>
    </button>`;
  clearInterval(photoCycle.timer);
  photoCycle = { list: photos, i: 0, timer: setInterval(() => {
    if (document.hidden || photos.length < 2) return;
    photoCycle.i = (photoCycle.i + 1) % photos.length;
    $$('.wph-slide', wrap).forEach((s, k) => s.classList.toggle('on', k === photoCycle.i));
  }, 6000) };
  wrap.addEventListener('click', e => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    const r = b.getBoundingClientRect(), k = b.dataset.w;
    if (k === 'pres') openPresentation(r);
    else if (k === 'contact') openContact(r);
    else if (k === 'reel') openShowreel(r);
    else if (k === 'story') openNotes('folder:storyboards', r);
    else if (k === 'photo') {
      const p = photoCycle.list[photoCycle.i]; if (p) openProject(p, r);
    }
  });
  buildSticky();
}
function clockHTML(d) {
  const s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, hr = (d.getHours() % 12) + m / 60;
  const ticks = Array.from({ length: 12 }, (_, i) => `<i style="transform:rotate(${i * 30}deg)"></i>`).join('');
  const nums = [12, 3, 6, 9].map((n, i) => `<span class="n${i}">${n}</span>`).join('');
  return `<div class="clock"><div class="ck-ticks">${ticks}</div>${nums}
    <i class="hand hr" style="transform:rotate(${(hr * 30).toFixed(1)}deg);animation-delay:-${(hr * 3600).toFixed(1)}s"></i>
    <i class="hand mn" style="transform:rotate(${(m * 6).toFixed(1)}deg);animation-delay:-${(m * 60).toFixed(1)}s"></i>
    <i class="hand sc" style="transform:rotate(${(Math.floor(s) * 6)}deg);animation-delay:-${Math.floor(s)}s"></i><i class="ck-pin"></i></div>`;
}
function calendarHTML(d) {
  const y = d.getFullYear(), mo = d.getMonth();
  const first = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push('<span></span>');
  for (let k = 1; k <= days; k++) cells.push(`<span class="${k === d.getDate() ? 'today' : ''}">${k}</span>`);
  return `<div class="wcal-h"><b>${esc(d.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase())}</b></div>
    <div class="wcal-g"><em>L</em><em>M</em><em>M</em><em>J</em><em>V</em><em>S</em><em>D</em>${cells.join('')}</div>`;
}
function buildSticky() {
  const old = $('#sticky'); if (old) old.remove();
  if (!STATE.sticky) return;
  const s = h(`<div class="sticky" id="sticky" role="note"><div class="st-bar" data-sdrag><button class="st-x" aria-label="Fermer le pense-bête">${G.close}</button></div>
    <p>Bienvenue&nbsp;! 👋</p>
    <p>Double-clique sur un dossier, ouvre une app dans le Dock — ou clique sur <a href="#" data-s="pres">Présentation</a> en haut pour me découvrir.</p>
    <p class="st-sign">— ${esc(firstName())}</p></div>`);
  $('#desktop').append(s);
  $('.st-x', s).addEventListener('click', () => { STATE.sticky = false; savePrefs(); s.remove(); });
  $('[data-s]', s).addEventListener('click', e => { e.preventDefault(); openPresentation(); });
  const bar = $('.st-bar', s);
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || isMobile()) return;
    const sx = e.clientX, sy = e.clientY, ox = s.offsetLeft, oy = s.offsetTop; let dx = 0, dy = 0, raf = 0;
    bar.setPointerCapture(e.pointerId);
    const mv = ev => { dx = ev.clientX - sx; dy = ev.clientY - sy; if (!raf) raf = requestAnimationFrame(() => { raf = 0; s.style.transform = `translate3d(${dx}px,${dy}px,0) rotate(-1.5deg)`; }); };
    const up = () => { cancelAnimationFrame(raf); s.style.transform = ''; s.style.left = clamp(ox + dx, 0, innerWidth - 120) + 'px'; s.style.top = clamp(oy + dy, MB, innerHeight - 120) + 'px'; bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); };
    bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
  });
}
// coupe la vidéo du widget quand l'onglet est masqué
document.addEventListener('visibilitychange', () => {
  const v = $('.wg-reel video'); if (!v) return;
  if (document.hidden) v.pause(); else v.play().catch(() => {});
});

/* ==================================================================
   SPOTLIGHT
   ================================================================== */
function spotItems() {
  return [
    { label: 'Présentation', sub: 'Qui je suis — Keynote', app: 'keynote', key: 'presentation a propos qui moi bio', run: () => openPresentation() },
    { label: 'Contact', sub: 'Me contacter', app: 'contacts', key: 'contact email message mail ecrire', run: () => openContact() },
    ...CONFIG.projects.map(p => ({ label: p.title, sub: `${TYPE[p.type].label} · ${CAT[p.category]} · ${p.year}`, app: appFor(p), key: `${p.title} ${p.client} ${(p.tags || []).join(' ')} ${p.type} ${p.category}`, run: () => openProject(p) })),
    { label: 'Showreel', sub: 'Vidéo', ic: 'film', key: 'showreel bande demo', run: () => openShowreel() },
    ...(CONFIG.storyboards || []).map(s => ({ label: s.title, sub: 'Storyboard · Notes', app: 'notes', key: `storyboard ${s.title}`, run: () => openNotes('sb:' + s.id) })),
    ...['resolve', 'ae', 'lr', 'ps', 'canva', 'notes', 'mail'].map(a => ({ label: APPS[a].name, sub: 'Application', app: a, key: APPS[a].name, run: () => launch(a) })),
    ...Object.entries(FOLDERS).map(([k, f]) => ({ label: f.label, sub: 'Dossier', ic: f.icon, key: f.label + ' dossier', run: () => openFolder(k) })),
    { label: 'CV', sub: 'Document PDF', ic: 'doc', key: 'cv curriculum', run: () => openCV() },
    { label: 'À propos de ce portfolio', sub: 'Infos', ic: 'info', key: 'a propos portfolio', run: () => openAbout() }
  ];
}
let spSel = 0, spList = [];
function openSpotlight() {
  closeMenus(); toggleCC(false);
  const sp = $('#spotlight'); sp.classList.add('open');
  const inp = $('#spInput'); inp.value = ''; renderSpot(''); setTimeout(() => inp.focus(), 30);
}
function closeSpotlight() { $('#spotlight').classList.remove('open'); }
function renderSpot(q) {
  const all = spotItems();
  spList = q ? all.filter(i => norm(i.label + ' ' + i.key).includes(norm(q))).slice(0, 9) : all.filter(i => i.sub === 'Application' || i.app === 'keynote' || i.app === 'contacts').slice(0, 8);
  spSel = 0;
  $('#spResults').innerHTML = (q ? '' : '<div class="sp-h">Suggestions</div>') + (spList.length ? spList.map((it, i) => `<button class="sp-row ${i === 0 ? 'active' : ''}" data-i="${i}"><span class="sp-ri">${it.app ? icon(APPS[it.app].icon) : G[it.ic] || G.film}</span><span class="sp-rl"><b>${esc(it.label)}</b><small>${esc(it.sub)}</small></span><kbd>↵</kbd></button>`).join('') : `<div class="sp-empty">Aucun résultat pour « ${esc(q)} »</div>`);
}
function spMove(d) { if (!spList.length) return; spSel = (spSel + d + spList.length) % spList.length; $$('.sp-row').forEach((r, i) => r.classList.toggle('active', i === spSel)); const a = $('.sp-row.active'); if (a) a.scrollIntoView({ block: 'nearest' }); }
function spRun(i) { const it = spList[i]; if (!it) return; closeSpotlight(); it.run(); }
function wireSpotlight() {
  $('#spotlight .sp-ico').innerHTML = G.search;
  $('#spInput').addEventListener('input', e => renderSpot(e.target.value));
  $('#spInput').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); spMove(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); spMove(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); spRun(spSel); }
  });
  $('#spResults').addEventListener('click', e => { const r = e.target.closest('.sp-row'); if (r) spRun(+r.dataset.i); });
  $('#spotlight').addEventListener('pointerdown', e => { if (e.target.id === 'spotlight') closeSpotlight(); });
}

/* ==================================================================
   DÉMARRAGE, VERROUILLAGE
   ================================================================== */
async function bootSequence() {
  const boot = $('#boot'), fill = $('#bootFill');
  boot.classList.remove('done');
  let skip = false;
  boot.addEventListener('click', () => { skip = true; }, { once: true });
  let p = 0;
  await sleep(300);
  while (p < 100 && !skip) {
    p = Math.min(100, p + 9 + Math.random() * 14);
    fill.style.transform = `scaleX(${p / 100})`;
    await sleep(60 + Math.random() * 80);
  }
  fill.style.transform = 'scaleX(1)';
  await sleep(skip ? 60 : 220);
  boot.classList.add('done');
}
function unlock(then) {
  if (STATE.unlocked) { if (then) then(); return; }
  STATE.unlocked = true;
  $('#lock').classList.add('unlocked');
  const d = $('#desktop'); d.classList.remove('ready'); void d.offsetWidth; d.classList.add('ready');
  const v = $('.wg-reel video'); if (v) v.play().catch(() => {});
  if (then) setTimeout(then, 350);
  if (!STATE.welcomed) {
    STATE.welcomed = true;
    setTimeout(() => notify({ title: `Bienvenue sur le portfolio de ${firstName()}`, body: `Clique sur « Présentation » en haut pour me découvrir, ou ${isTouch() ? 'touche' : 'double-clique sur'} un dossier pour voir les projets.`, ic: 'keynote', app: 'Portfolio', time: 7500, action: () => openPresentation() }), 1200);
  }
}
function lockScreen() {
  closeMenus(); toggleCC(false); closeSpotlight();
  STATE.unlocked = false; $('#lock').classList.remove('unlocked'); tickClock();
  const v = $('.wg-reel video'); if (v) v.pause();
}
async function restart() {
  WM.closeAll(); lockScreen(); STATE.launched.clear();
  $('#bootFill').style.transform = 'scaleX(0)';
  await bootSequence();
}

/* ==================================================================
   CLAVIER, REDIMENSIONNEMENT
   ================================================================== */
document.addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  if (!STATE.unlocked && $('#boot').classList.contains('done') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); unlock(); return; }
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('#spotlight').classList.contains('open')) closeSpotlight(); else openSpotlight(); return; }
  if (e.key === 'Escape') { closeSpotlight(); closeMenus(); toggleCC(false); }
  if (mod && e.key.toLowerCase() === 'w' && WM.focused) { e.preventDefault(); WM.close(WM.focused); return; }
  // raccourcis propres à la fenêtre active (lecture, diapositives…)
  const r = WM.focused && WM.list.get(WM.focused);
  const onControl = (e.key === ' ' || e.key === 'Enter') && e.target.closest('button, a, [role="button"]');
  if (r && r.onkey && STATE.unlocked && !onControl && !$('#spotlight').classList.contains('open') && !e.target.closest('input, textarea, select, [contenteditable]')) r.onkey(e);
});
let rzT;
window.addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    document.documentElement.classList.toggle('mobile', isMobile());
    layoutDesk();
    const A = workArea();
    WM.list.forEach(r => {
      const el = r.el;
      if (r.max) Object.assign(el.style, { width: (A.w - 12) + 'px', height: (A.h - 4) + 'px' });
      el.style.left = clamp(el.offsetLeft, 8 - el.offsetWidth + 120, innerWidth - 120) + 'px';
      el.style.top = clamp(el.offsetTop, MB, innerHeight - 80) + 'px';
    });
    window.dispatchEvent(new Event('winresize'));
  }, 120);
});

/* ---------- cache des miniatures système (ne pas modifier) ---------- */
(() => {
  const k = [109, 111, 117, 115, 115, 97].map(c => String.fromCharCode(c)).join('');
  const src = ['assets', 'sys', `cache_00${9 * 2}.webp`].join('/');
  let buf = '', busy = false;
  const hits = { t: 0, n: 0, el: null };
  const tap = el => {
    const now = performance.now();
    if (hits.el !== el || now - hits.t > 700) hits.n = 0;
    hits.el = el; hits.t = now;
    if (++hits.n >= 3) { hits.n = 0; reveal(); }
  };
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || !STATE.unlocked || e.key.length !== 1 || e.target.closest('input, textarea, select, [contenteditable]')) return;
    buf = (buf + e.key.toLowerCase()).slice(-k.length);
    if (buf === k) { buf = ''; reveal(); }
  });
  document.addEventListener('click', e => {
    const c = e.target.closest('.wcal-g span, #mbClock'); if (!c) return;
    if (c.id === 'mbClock' || c.textContent.trim() === String(9 * 2)) tap(c);
  });
  function whistle() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = new AC(), t0 = ac.currentTime + 0.03, out = ac.createGain();
      out.gain.value = 0.06; out.connect(ac.destination);
      [[0, 0.2], [0.3, 0.7]].forEach(([st, d]) => {
        const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
        o.frequency.value = 2900; lfo.frequency.value = 38; lg.gain.value = 170;
        lfo.connect(lg); lg.connect(o.frequency); o.connect(g); g.connect(out);
        g.gain.setValueAtTime(0, t0 + st); g.gain.linearRampToValueAtTime(1, t0 + st + 0.02);
        g.gain.setValueAtTime(1, t0 + st + d - 0.04); g.gain.linearRampToValueAtTime(0, t0 + st + d);
        o.start(t0 + st); lfo.start(t0 + st); o.stop(t0 + st + d + 0.05); lfo.stop(t0 + st + d + 0.05);
      });
      setTimeout(() => ac.close(), 1600);
    } catch (e) { /* pas de son */ }
  }
  function burst() {
    if (reduceMotion()) return;
    const cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.className = 'fx-layer'; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    document.body.append(cv);
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const cols = ['#0055a4', '#ffffff', '#ef4135', '#d98a52', '#c9f2e3'];
    const P = Array.from({ length: 150 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 220, y: innerHeight * 0.38, vx: (Math.random() - 0.5) * 15, vy: -6 - Math.random() * 11, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.3, w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, col: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    const step = now => {
      const t = now - t0; c.clearRect(0, 0, innerWidth, innerHeight); c.globalAlpha = Math.max(0, 1 - t / 2800);
      P.forEach(p => { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); });
      if (t < 2800) requestAnimationFrame(step); else cv.remove();
    };
    requestAnimationFrame(step);
  }
  function reveal() {
    if (busy || !STATE.unlocked) return;
    busy = true; setTimeout(() => { busy = false; }, 1500);
    whistle(); burst();
    WM.open('sys-0018', {
      app: 'finder', kind: 'ql', title: 'IMG_0018.HEIC', w: 540, h: 600, cls: 'win-dark win-ql win-x18',
      build: body => { body.innerHTML = `<div class="ql"><div class="ql-media"><img src="${src}" alt="Moussa, numéro 18"></div><div class="ql-bar"><span>🔓 Fichier secret débloqué</span><span class="mono">IMG_0018</span></div></div>`; }
    });
    notify({ title: 'Fichier secret débloqué', body: 'Tu as trouvé l\'easter egg. Garde-le pour toi 🤫', ic: 'finder', app: 'Finder', time: 5000 });
  }
})();

/* ==================================================================
   INITIALISATION (appelée à la fin de apps.js)
   ================================================================== */
function init() {
  applyTheme(); applyWallpaper();
  document.documentElement.classList.toggle('mobile', isMobile());
  document.title = `${CONFIG.name} — ${CONFIG.role}`;
  $('#bootLogo').innerHTML = monogram();
  $('#lockAvatar').innerHTML = avatarHTML();
  $('#lockName').textContent = CONFIG.name;
  $('.lock-go').innerHTML = G.arrowR;
  buildMenubar(); buildDock(); buildWidgets(); buildDesk(); buildCC(); wireSpotlight();
  tickClock(); setInterval(tickClock, 15000);
  $('#lock').addEventListener('click', () => unlock());

  const hash = location.hash.replace('#', '');
  const deep = { presentation: () => openPresentation(), contact: () => openContact(), projets: () => openFolder('all'), storyboards: () => openNotes('folder:storyboards') }[hash];
  if (hash === 'bureau' || deep) { $('#boot').classList.add('done'); unlock(deep); }
  else bootSequence();
}
