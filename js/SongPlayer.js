/* ============================================================
   SongPlayer.js — Scroll-triggered audio for the Tamil verse
   Sudarasan & Maheswari Wedding Invitation

   iOS/Android enforce a hard rule: unmuted audio CANNOT autoplay
   without a user tap — no code can bypass this. Solution used by
   Instagram, YouTube Shorts, TikTok: autoplay MUTED, show a clear
   "tap to unmute" prompt. One tap → full sound forever.
   ============================================================ */

(function () {
  'use strict';

  var AUDIO_ID    = 'story-audio';
  var BTN_ID      = 'story-audio-btn';
  var SECTION_SEL = '.story__tamil';
  var THRESHOLD   = 0.3;

  function init() {
    var audio   = document.getElementById(AUDIO_ID);
    var btn     = document.getElementById(BTN_ID);
    var section = document.querySelector(SECTION_SEL);

    if (!audio || !btn || !section) return;

    // Always start muted — guarantees autoplay on every browser/device
    audio.muted = true;

    var unmuted = false;   // user has tapped to unmute at least once

    // ── UI ────────────────────────────────────────────────────

    function updateBtn() {
      if (audio.paused) {
        btn.dataset.state = 'paused';
        btn.setAttribute('aria-label', 'Play');
        btn.classList.remove('needs-unmute');
        return;
      }
      if (!unmuted) {
        // Playing but muted — show animated unmute prompt
        btn.dataset.state = 'muted';
        btn.setAttribute('aria-label', 'Tap to unmute');
        btn.classList.add('needs-unmute');
      } else if (audio.muted) {
        btn.dataset.state = 'muted';
        btn.setAttribute('aria-label', 'Unmute');
        btn.classList.remove('needs-unmute');
      } else {
        btn.dataset.state = 'playing';
        btn.setAttribute('aria-label', 'Mute');
        btn.classList.remove('needs-unmute');
      }
    }

    // ── IntersectionObserver ──────────────────────────────────

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              // Muted play always succeeds — no browser blocks this
              audio.play().catch(function () {});
            } else if (!unmuted) {
              // Only pause on scroll-away before the user has interacted
              audio.pause();
            }
            updateBtn();
          });
        },
        { threshold: THRESHOLD }
      );
      observer.observe(section);
    }

    // ── Button ────────────────────────────────────────────────

    btn.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().catch(function () {});
        updateBtn();
        return;
      }
      if (!unmuted) {
        // First tap: unmute and keep playing
        unmuted = true;
        audio.muted = false;
      } else {
        audio.muted = !audio.muted;
      }
      updateBtn();
    });

    updateBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
