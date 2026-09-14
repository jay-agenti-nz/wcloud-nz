/* Where an enquiry came from.
 *
 * Two halves that answer the same question from different angles:
 *
 *   1. What the visitor tells us — the "How did you hear about us?"
 *      select on every form. Honest, but only as good as their memory.
 *   2. What the link tells us — the UTM tags on the URL they arrived
 *      through, captured into a hidden field so the answer arrives even
 *      when nobody fills the select in.
 *
 * First touch wins, not last. Someone can land from an Instagram link,
 * read the guides, wander to the pricing page and only then enquire; by
 * that point the URL has lost its tags. We stash them at the first page
 * of the visit and hand back the same value at submit time.
 *
 * Session storage, deliberately: it is gone when the browser tab closes,
 * it never leaves the device except attached to a form the visitor chose
 * to send, and it holds nothing that identifies anybody.
 */

var KEY = 'wc_first_touch';

/* Query keys worth keeping. Anything else on the URL is somebody else's
   tracking and none of our business. */
var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function readFromUrl() {
  var q = new URLSearchParams(window.location.search);
  var hit = {};
  UTM_KEYS.forEach(function (k) {
    var v = q.get(k);
    if (v) hit[k] = v.slice(0, 120);
  });

  /* Google Ads and Meta stamp their own click ids. Worth noting the
     channel, not the id itself, which is unique to the person. */
  if (q.get('gclid')) hit.utm_source = hit.utm_source || 'google';
  if (q.get('fbclid')) hit.utm_source = hit.utm_source || 'facebook';

  if (!Object.keys(hit).length) return null;
  hit.landing_page = window.location.pathname;
  return hit;
}

function readFromReferrer() {
  var r = document.referrer;
  if (!r) return null;
  var host;
  try { host = new URL(r).hostname.replace(/^www\./, ''); } catch (e) { return null; }
  if (!host || host === window.location.hostname) return null;
  return { referrer: host, landing_page: window.location.pathname };
}

function store(v) {
  try { window.sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ }
}

function load() {
  try {
    var raw = window.sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

/* One flat string, because that is what lands in the Netlify Forms
   table and in the notification email. Readable beats structured here —
   Jay is reading it, not a script. */
function format(v) {
  if (!v) return 'direct';
  var parts = [];
  UTM_KEYS.forEach(function (k) {
    if (v[k]) parts.push(k.replace('utm_', '') + '=' + v[k]);
  });
  if (!parts.length && v.referrer) parts.push('referrer=' + v.referrer);
  if (v.landing_page) parts.push('landed=' + v.landing_page);
  return parts.length ? parts.join(' · ') : 'direct';
}

/* Runs on import, on every page that loads this module — which is all
   of them. The tagged link someone clicks usually lands on a guide or
   the photo page, not on the one with the enquiry form, so capturing
   only where a form exists would throw the answer away on the way in. */
(function capture() {
  if (load()) return;
  var hit = readFromUrl() || readFromReferrer();
  if (hit) store(hit);
})();

export function initAttribution(form) {
  if (!form) return;

  var field = form.querySelector('input[name="first_touch"]');
  if (field) field.value = format(load());

  /* "Other" on the source select reveals a free-text box. Same pattern
     as the other conditional fields on these forms. */
  var sel = form.querySelector('select[name="referral_source"]');
  var wrap = form.querySelector('[data-referral-other]');
  if (sel && wrap) {
    sel.addEventListener('change', function () {
      wrap.classList.toggle('show', this.value === 'Other');
    });
  }
}
