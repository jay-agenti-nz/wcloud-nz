/* ══════════════════════════════════════════════════════════════
   White Cloud — mobile navigation

   Below the breakpoint the pill nav hides its links, so without this
   there is no way to reach any section from a phone. This turns the
   hidden links into a proper disclosure menu.

   The button is a real button with aria-expanded and aria-controls.
   Escape closes it, focus returns to the toggle, and the page behind
   it does not scroll while it is open.
   ══════════════════════════════════════════════════════════════ */

export function initNav(nav) {
  if (!nav) return null;
  const list = nav.querySelector('.wc-nav-links');
  if (!list) return null;

  if (!list.id) list.id = 'wc-nav-menu';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'wc-nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', list.id);
  toggle.setAttribute('aria-label', 'Menu');
  toggle.innerHTML = '<span></span><span></span>';
  nav.appendChild(toggle);

  let open = false;

  function setOpen(next) {
    open = next;
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    // Keep the page still behind the menu rather than scrolling under it.
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }

  toggle.addEventListener('click', function () { setOpen(!open); });

  // A tap on any destination should take you there, not leave the
  // menu sitting over the section you just asked for.
  list.addEventListener('click', function (e) {
    if (e.target.closest('a') && open) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Reopening at desktop width would leave the flag set with no menu.
  const wide = window.matchMedia('(min-width: 961px)');
  const onWide = function () { if (wide.matches && open) setOpen(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);

  return {
    close: function () { setOpen(false); },
    destroy: function () {
      setOpen(false);
      toggle.remove();
      if (wide.removeEventListener) wide.removeEventListener('change', onWide);
    }
  };
}
