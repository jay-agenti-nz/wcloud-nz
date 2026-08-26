/* ══════════════════════════════════════════════════════════════
   White Cloud — scroll reveal

   Elements marked .fu (one item) or .fug (a group, staggered) fade
   up as they come into view.

   The important part is what happens when it cannot work. The
   markup is visible by default; this script only hides an element
   after it has successfully started observing it. If there is no
   IntersectionObserver, or the reader prefers reduced motion, the
   page simply stays visible — content is never hidden by a script
   that might not get the chance to bring it back.

   There is also a deadline: anything still hidden after a moment is
   shown regardless. A missed callback should cost an animation, not
   the page.
   ══════════════════════════════════════════════════════════════ */

export function initReveal(options) {
  const opts = options || {};
  const deadline = opts.deadline == null ? 1600 : opts.deadline;
  const els = Array.prototype.slice.call(
    document.querySelectorAll(opts.selector || '.fu, .fug')
  );
  if (!els.length) return null;

  const showAll = function () {
    els.forEach(function (el) { el.classList.remove('ready'); });
  };

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;   // leave everything as authored: visible
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: opts.threshold == null ? 0.12 : opts.threshold });

  els.forEach(function (el) {
    el.classList.add('ready');
    io.observe(el);
  });

  const timer = setTimeout(function () {
    els.forEach(function (el) {
      if (!el.classList.contains('in')) el.classList.add('in');
    });
  }, deadline);

  return {
    revealNow: function () { clearTimeout(timer); io.disconnect(); showAll(); },
    destroy: function () { clearTimeout(timer); io.disconnect(); }
  };
}
