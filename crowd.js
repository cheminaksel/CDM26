/* =============================================================
   crowd.js — Joue le cri de but (fichier audio/goal.mp3).
   On débloque l'audio au 1er clic (politique navigateur), puis
   chaque but rejoue le son depuis le début.
   ============================================================= */
const Crowd = (() => {
  let audio = null;
  let enabled = false;

  function enable() {
    if (!audio) {
      audio = new Audio("audio/goal.mp3");
      audio.preload = "auto";
    }
    enabled = true;
    // Petit "play/pause" pour débloquer la lecture auto sur mobile/Chrome.
    try { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {}); } catch {}
    return enabled;
  }

  function isEnabled() { return enabled; }

  function cheer() {
    if (!enabled || !audio) return;
    try { audio.currentTime = 0; audio.play().catch(() => {}); } catch {}
  }

  return { enable, isEnabled, cheer };
})();
