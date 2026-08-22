/* ══════════════════════════════════════════════════════════════
   White Cloud — pointer tilt

   Leans an element toward the cursor. Used by the hero card and the
   project grid, so both behave identically.

   Sits out entirely when it would be wrong or unwelcome: reduced
   motion, and coarse pointers where there is no cursor to follow and
   a transform would only fight the scroll.
   ══════════════════════════════════════════════════════════════ */

export function initTilt(el, options) {
  const opts = options || {};
  const maxX = opts.maxX == null ? 6 : opts.maxX;   // degrees
  const maxY = opts.maxY == null ? 7 : opts.maxY;
  const lift = opts.lift == null ? 0 : opts.lift;   // px
  const zone = opts.zone || el;                     // area that drives it

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(pointer: fine)');
  if (reduced.matches || !fine.matches) return null;

  let frame = 0;
  let pending = null;

  function apply() {
    frame = 0;
    if (!pending) return;
    el.style.transform =
      'perspective(1400px) rotateY(' + pending.y.toFixed(2) + 'deg) rotateX(' +
      pending.x.toFixed(2) + 'deg) translate3d(0,' + (-lift) + 'px,0)';
  }

  function onMove(e) {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    pending = { y: px * maxY, x: -py * maxX };
    if (!frame) frame = requestAnimationFrame(apply);
  }

  function reset() {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    pending = null;
    el.style.transform = '';
  }

  zone.addEventListener('pointermove', onMove, { passive: true });
  zone.addEventListener('pointerleave', reset, { passive: true });
  // Keyboard users get the lift without the tilt, which has no meaning
  // without a cursor position.
  el.addEventListener('blur', reset, true);

  return {
    destroy: function () {
      reset();
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerleave', reset);
      el.removeEventListener('blur', reset, true);
    }
  };
}
