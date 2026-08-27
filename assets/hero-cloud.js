/* ══════════════════════════════════════════════════════════════
   White Cloud — hero cloud field

   Layered cloud billboards in WebGL. Textures are generated at
   runtime, so there is nothing to download and no library.

   The canvas draws clouds only — it is transparent, and the tinted
   sky behind it is CSS. That is also the fallback: if WebGL is
   missing or the context is lost, the hero is still a tinted field
   with readable type on it, and nothing is broken.

   Rules it holds to:
     · one still frame under prefers-reduced-motion
     · no frames while scrolled out of view or in a hidden tab
     · device pixel ratio capped at 1.5
   ══════════════════════════════════════════════════════════════ */

/* Seeded RNG so the cloud arrangement is the same on every visit. */
export function makeRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── Cloud texture ──────────────────────────────────────────────
   A puff is a cluster of soft circles, lit from above: the alpha
   shape is built first, then a top-to-bottom gradient is painted
   inside it. That gradient is what makes a flat sprite read as a
   volume — bright crown, cool shaded underside. */
export function makeCloudTexture(rand, blurPx) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');

  // Alpha shape: overlapping blobs along a squashed arc.
  ctx.filter = 'blur(' + blurPx + 'px)';
  const puffs = 9 + Math.floor(rand() * 4);
  for (let i = 0; i < puffs; i++) {
    const t = i / (puffs - 1);
    const x = S * (0.16 + t * 0.68) + (rand() - 0.5) * S * 0.08;
    const arc = Math.sin(t * Math.PI);
    const y = S * (0.62 - arc * 0.16) + (rand() - 0.5) * S * 0.05;
    const r = S * (0.10 + arc * 0.13 + rand() * 0.04);
    // Solid core with a short soft rim — a diffuse falloff here is
    // what turns a cloud into fog.
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.78, 'rgba(255,255,255,1)');
    g.addColorStop(0.93, 'rgba(255,255,255,0.82)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Light the shape from above, inside the alpha it already has.
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-atop';
  const lit = ctx.createLinearGradient(0, S * 0.16, 0, S * 0.86);
  lit.addColorStop(0, '#ffffff');
  lit.addColorStop(0.42, '#fbfdfe');
  lit.addColorStop(0.78, '#dae8f1');
  lit.addColorStop(1, '#b7cddd');
  ctx.fillStyle = lit;
  ctx.fillRect(0, 0, S, S);
  ctx.globalCompositeOperation = 'source-over';

  return c;
}

const VERT = [
  'attribute vec2 a_quad;',
  'uniform vec4 u_rect;',   // x, y, w, h in CSS pixels
  'uniform vec2 u_res;',
  'uniform float u_rot;',
  'varying vec2 v_uv;',
  'void main() {',
  '  v_uv = a_quad;',
  '  vec2 c = a_quad - 0.5;',
  '  float s = sin(u_rot), co = cos(u_rot);',
  '  c = vec2(c.x * co - c.y * s, c.x * s + c.y * co);',
  '  vec2 px = u_rect.xy + (c + 0.5) * u_rect.zw;',
  '  vec2 clip = vec2(px.x / u_res.x * 2.0 - 1.0, 1.0 - px.y / u_res.y * 2.0);',
  '  gl_Position = vec4(clip, 0.0, 1.0);',
  '}'
].join('\n');

const FRAG = [
  'precision mediump float;',
  'uniform sampler2D u_tex;',
  'uniform float u_alpha;',
  'uniform vec3 u_tint;',
  'varying vec2 v_uv;',
  'void main() {',
  '  vec4 t = texture2D(u_tex, v_uv);',
  '  float a = t.a * u_alpha;',
  // Premultiplied: the canvas composites over the CSS sky behind it.
  '  gl_FragColor = vec4(t.rgb * u_tint * a, a);',
  '}'
].join('\n');

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function initHeroCloud(canvas, options) {
  const opts = options || {};
  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true })
      || canvas.getContext('experimental-webgl', { alpha: true, antialias: false });
  } catch (e) {
    gl = null;
  }
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
  const aQuad = gl.getAttribLocation(prog, 'a_quad');
  gl.enableVertexAttribArray(aQuad);
  gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0);

  const uRect  = gl.getUniformLocation(prog, 'u_rect');
  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uRot   = gl.getUniformLocation(prog, 'u_rot');
  const uAlpha = gl.getUniformLocation(prog, 'u_alpha');
  const uTint  = gl.getUniformLocation(prog, 'u_tint');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* Three sharpness levels. Distant clouds are crisp and small,
     near ones are large and soft — that difference in focus is what
     gives the field depth. */
  const rand = makeRandom(20260821);
  const textures = [0, 1.5, 4].map(function (blur) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeCloudTexture(rand, blur));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  });

  let W = 0, H = 0, dpr = 1;
  let clouds = [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Clearing: the region the headline occupies. Clouds fade as they
     drift through it, so type is never read against a moving edge. */
  function clearingAlpha(x, y) {
    const rect = opts.clearing && opts.clearing();
    if (!rect) return 1;
    const cx = Math.max(rect.left, Math.min(x, rect.right));
    const cy = Math.max(rect.top, Math.min(y, rect.bottom));
    const d = Math.hypot(x - cx, y - cy);
    const feather = 190;
    if (d >= feather) return 1;
    const t = d / feather;
    return 0.12 + 0.88 * (t * t * (3 - 2 * t));
  }

  function build() {
    const small = W < 900;
    const count = small ? 9 : 14;
    const r = makeRandom(987654321);
    clouds = [];
    for (let i = 0; i < count; i++) {
      // Depth 0 = far haze, 1 = right up against the viewer.
      const z = Math.pow(r(), 0.75);
      const layer = z < 0.34 ? 0 : (z < 0.7 ? 1 : 2);
      const size = W * (0.085 + z * 0.20) * (small ? 1.3 : 1);
      clouds.push({
        x: r() * (W + size) - size * 0.5,
        y: H * (0.04 + r() * 0.92),
        z: z,
        size: size,
        tex: textures[layer],
        rot: (r() - 0.5) * 0.16,
        speed: (5 + z * 26) * (r() < 0.5 ? 1 : 0.72),
        bobPhase: r() * Math.PI * 2,
        bobAmp: 5 + z * 16,
        alpha: 0.62 + z * 0.30 + r() * 0.08,
        tint: 0.97 + (1 - z) * 0.03,
        wx: 0, wy: 0
      });
    }
    clouds.sort(function (a, b) { return a.z - b.z; });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = rect.width;
    H = rect.height;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, W, H);
    build();
  }

  // Pointer acts as wind: clouds are pushed away and ease back.
  let pointer = { x: -9999, y: -9999, active: false };
  let scrollLift = 0;

  function draw() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const cx = c.x + c.wx;
      const cy = c.y + c.wy - scrollLift * (0.25 + c.z * 0.75);
      const a = c.alpha * clearingAlpha(cx, cy);
      if (a <= 0.01) continue;
      gl.bindTexture(gl.TEXTURE_2D, c.tex);
      gl.uniform4f(uRect, cx - c.size / 2, cy - c.size / 2, c.size, c.size);
      gl.uniform1f(uRot, c.rot);
      gl.uniform1f(uAlpha, a);
      gl.uniform3f(uTint, c.tint, c.tint, Math.min(1, c.tint + 0.02));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  function step(dt, t) {
    const windR = Math.min(W, H) * 0.42;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x += c.speed * dt;
      if (c.x - c.size > W) c.x = -c.size;
      c.y += Math.sin(t * 0.00021 + c.bobPhase) * c.bobAmp * dt * 0.12;

      let tx = 0, ty = 0;
      if (pointer.active) {
        const dx = c.x - pointer.x;
        const dy = c.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < windR) {
          const f = (1 - d / windR);
          const push = f * f * 62 * (0.35 + c.z);
          tx = (dx / d) * push;
          ty = (dy / d) * push;
        }
      }
      // Ease toward the target push, and back to rest when it clears.
      c.wx += (tx - c.wx) * Math.min(1, dt * 2.2);
      c.wy += (ty - c.wy) * Math.min(1, dt * 2.2);
    }
  }

  let raf = 0, last = 0, running = false;

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt, now);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced.matches) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // ── Wiring ──────────────────────────────────────────────────
  const onPointerMove = function (e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
  };
  const onPointerLeave = function () { pointer.active = false; };

  const onScroll = function () {
    scrollLift = Math.min(window.scrollY, H) * 0.22;
    if (!running) draw();
  };

  let resizeTimer = 0;
  const onResize = function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); draw(); }, 150);
  };

  const onVisibility = function () {
    if (document.hidden) stop(); else if (visible) start();
  };

  let visible = true;
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 });
    io.observe(canvas);
  }

  const onReducedChange = function () {
    if (reduced.matches) { stop(); draw(); }
    else if (visible && !document.hidden) start();
  };

  resize();
  draw();

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('blur', onPointerLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  if (reduced.addEventListener) reduced.addEventListener('change', onReducedChange);

  if (!reduced.matches && !io) start();

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    stop();
  });

  return {
    /* Draw a single frame. Used after a layout change, and handy for
       measuring per-frame cost without waiting on the compositor. */
    renderOnce: function (dtSeconds) {
      if (dtSeconds) step(dtSeconds, performance.now());
      draw();
    },
    destroy: function () {
      stop();
      if (io) io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (reduced.removeEventListener) reduced.removeEventListener('change', onReducedChange);
    }
  };
}
