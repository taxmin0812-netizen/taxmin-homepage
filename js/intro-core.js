(function () {
  'use strict';

  var OPT = window.MIN_INTRO || {};
  var FILM = !!OPT.film;
  var qs = new URLSearchParams(location.search);
  var FROZEN = qs.has('t') ? parseFloat(qs.get('t')) : null;

  var LOGO = {
    color: '#0E1626', ink: '#0E1626', mint: '#3EE6A1',
    strokes: 'M48 94.5L75.5 121.5M115 116.5L152 51',
    width: 24, dot: [98.5, 145, 15]
  };

  var SUBS = ['M48 94.5L75.5 121.5', 'M115 116.5L152 51'];
  var strokePath = null, subPaths = [], subLens = [38.6, 75.3], strokeLen = 113.9;
  try {
    strokePath = new Path2D(LOGO.strokes);
    SUBS.forEach(function (d) { subPaths.push(new Path2D(d)); });
  } catch (e) {}

  function drawLogo(ctx, cx, cy, size, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.translate(cx, cy);
    var k = size / 200;
    ctx.scale(k, k);
    if (o.showDisc !== false) {
      var ds = o.discScale == null ? 1 : o.discScale;
      ctx.fillStyle = o.disc || LOGO.color;
      ctx.beginPath();
      if (o.tile) ctx.roundRect(-100 * ds, -100 * ds, 200 * ds, 200 * ds, 58 * ds); else ctx.arc(0, 0, 100 * ds, 0, Math.PI * 2);
      ctx.fill();
    }
    if (window.TaxminLogo) { window.TaxminLogo.draw(ctx, o); ctx.restore(); return; }
    ctx.translate(-100, -100);
    var d = o.draw == null ? 1 : o.draw;
    if (d > 0 && strokePath) {
      ctx.strokeStyle = o.stroke || '#FFFFFF';
      ctx.lineWidth = LOGO.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (d >= 1 || !subPaths.length) {
        ctx.stroke(strokePath);
      } else {
        var left = strokeLen * d;
        for (var si = 0; si < subPaths.length && left > 0.5; si++) {
          var part = Math.min(subLens[si], left);
          ctx.setLineDash([part, subLens[si] + 2]);
          ctx.stroke(subPaths[si]);
          left -= subLens[si];
        }
        ctx.setLineDash([]);
      }
    }
    var dotA = o.dotAlpha == null ? 1 : o.dotAlpha;
    if (dotA > 0) {
      ctx.globalAlpha *= dotA;
      ctx.fillStyle = o.dot || LOGO.mint;
      ctx.beginPath(); ctx.arc(LOGO.dot[0], LOGO.dot[1], LOGO.dot[2] * (o.dotScale == null ? 1 : o.dotScale), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  var samp = null;
  function buildSampler() {
    var S = 400, c = document.createElement('canvas');
    c.width = S; c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    drawLogo(x, S / 2, S / 2, S, { disc: '#ff0000', stroke: '#00ff00', dot: '#0000ff' });
    var px = x.getImageData(0, 0, S, S).data, lists = [[], [], []];
    for (var i = 0; i < S * S; i++) {
      var r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
      if (g > 160 && r < 120) lists[1].push(i);
      else if (b > 160 && r < 120) lists[2].push(i);
      else if (r > 160 && g < 120 && b < 120) lists[0].push(i);
    }
    samp = { S: S, lists: lists };
  }
  function sampleLogo(rand, kind) {
    if (!samp) buildSampler();
    var L = samp.lists[kind];
    if (!L.length) return [0.5, 0.5];
    var i = L[Math.floor(rand() * L.length)];
    return [((i % samp.S) + rand()) / samp.S, (Math.floor(i / samp.S) + rand()) / samp.S];
  }

  var FONT = '"Pretendard Variable", Pretendard, -apple-system, "Malgun Gothic", sans-serif';
  function beat(ctx, t, o) {
    var a = sstep(o.t0, o.t0 + 0.38, t), b = 1 - sstep(o.t1 - 0.32, o.t1, t);
    if (a <= 0 || b <= 0) return 0;
    var size = o.size, align = o.align || 'left';
    ctx.save();
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    var lines = String(o.text).split('\n');

    ctx.font = (o.weight || 800) + ' ' + Math.round(size) + 'px ' + FONT;
    var widest = 0; lines.forEach(function (ln) { widest = Math.max(widest, ctx.measureText(ln).width); });
    if (o.maxW && widest > o.maxW) size = size * o.maxW / widest;
    var lh = size * 1.18;
    var top = o.y - (o.label ? size * 0.75 : 0);
    var hgt = (o.label ? size * 0.75 : 0) + lines.length * lh;
    var w = o.maxW || size * 12;
    var x0 = align === 'center' ? o.x - w / 2 : (align === 'right' ? o.x - w : o.x);
    ctx.beginPath(); ctx.rect(x0 - 20, top - size * 0.4, w + 40, hgt + size * 0.6); ctx.clip();
    var rise = (1 - a) * size * 0.9 - (1 - b) * size * 0.5;
    ctx.globalAlpha = Math.min(a, b) * (o.alpha == null ? 1 : o.alpha);
    var y = o.y + rise;
    if (o.label) {
      ctx.font = '700 ' + Math.round(size * 0.30) + 'px ' + FONT;
      ctx.fillStyle = o.labelColor || o.color;
      var lab = o.label.split('').join(String.fromCharCode(8202));
      ctx.fillText(lab, o.x, y - size * 0.62);
    }
    ctx.font = (o.weight || 800) + ' ' + Math.round(size) + 'px ' + FONT;
    ctx.fillStyle = o.color;
    lines.forEach(function (ln, i) { ctx.fillText(ln, o.x, y + size * 0.82 + i * lh); });
    ctx.restore();
    return Math.min(a, b);
  }

  function scrim(ctx, api, rgb, a) {
    if (a <= 0) return;
    var W = api.W, H = api.H, g;
    ctx.save();
    if (api.mode === 'side') {
      g = ctx.createLinearGradient(0, 0, W * 0.62, 0);
      g.addColorStop(0, 'rgba(' + rgb + ',' + (0.92 * a).toFixed(3) + ')'); g.addColorStop(0.55, 'rgba(' + rgb + ',' + (0.6 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W * 0.62, H);
    } else {
      g = ctx.createLinearGradient(0, H * 0.45, 0, H);
      g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(0.35, 'rgba(' + rgb + ',' + (0.75 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',' + (0.9 * a).toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    }
    ctx.restore();
  }

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function sstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function ease(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function run(V) {
    var hero = document.getElementById('hero');
    var canvas = document.getElementById('intro-canvas');
    if (!hero || !canvas) return;
    var html = document.documentElement;
    var reduce = !FILM && FROZEN === null && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var TEXT_AT = V.textAt || 9.2;
    hero.setAttribute('data-intro', V.id || '');
    hero.setAttribute('data-theme', V.theme || 'dark');
    try { document.dispatchEvent(new CustomEvent('min:theme')); } catch (e) {}
    if (V.bg) hero.style.backgroundColor = V.bg;
    if (V.accent) hero.style.setProperty('--accent', V.accent);
    if (V.accentInk) hero.style.setProperty('--accent-ink', V.accentInk);
    if (V.accentHi) hero.style.setProperty('--accent-hi', V.accentHi);

    var overlay = document.createElement('canvas');
    overlay.id = 'intro-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    canvas.parentNode.insertBefore(overlay, canvas.nextSibling);
    var octx = overlay.getContext('2d');

    function layoutMode() {
      if (FILM) return 'film';
      var w = hero.clientWidth || window.innerWidth, h = hero.clientHeight || window.innerHeight;
      return (w / h >= 1.05 && w >= 860) ? 'side' : 'stack';
    }
    function reveal() {
      if (!hero.classList.contains('is-ready')) {
        hero.classList.add('is-ready');
        html.classList.add('intro-done');
        try { document.dispatchEvent(new CustomEvent('min:intro-done')); } catch (e) {}
      }
    }
    function hideChips() {
      ['intro-skip'].forEach(function (id) { var b = document.getElementById(id); if (b) b.setAttribute('hidden', ''); });
    }
    function fallback() {
      hero.classList.add('no-gl');
      if (V.fallbackBg) hero.style.background = V.fallbackBg;
      hero.setAttribute('data-layout', layoutMode());
      window.addEventListener('resize', function () { hero.setAttribute('data-layout', layoutMode()); });
      hideChips();
      reveal();
    }

    var W = 1, H = 1, dpr = 1, logo = { x: 0, y: 0, s: 100 }, mode = 'side';
    function resize() {
      var r = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      var small = Math.min(W, H) < 700;
      dpr = FILM ? (V.filmDpr || 1) : Math.min(window.devicePixelRatio || 1, small ? (V.maxDprSmall || 1.6) : (V.maxDpr || 1.75));
      mode = layoutMode();
      hero.setAttribute('data-layout', mode);

      if (mode === 'side') { var col = Math.min(W, 1136); logo = { x: Math.min(W * 0.735, (W - col) / 2 + col * 0.8), y: H * 0.5, s: Math.min(H * 0.48, W * 0.33) }; }
      else if (mode === 'stack') logo = { x: W * 0.5, y: H * 0.30, s: Math.min(W * 0.56, H * 0.27) };
      else if (W >= H) logo = { x: W * 0.5, y: H * 0.385, s: H * 0.40 };
      else logo = { x: W * 0.5, y: H * 0.385, s: W * 0.62 };
      var cw = Math.round(W * dpr), ch = Math.round(H * dpr);
      [canvas, overlay].forEach(function (c) { if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; } });
      if (V.resize) V.resize(api);
    }

    var api = {
      FILM: FILM, canvas: canvas, overlay: overlay, octx: octx, hero: hero,
      get W() { return W; }, get H() { return H; }, get dpr() { return dpr; }, get logo() { return logo; }, get mode() { return mode; },
      small: Math.min(window.innerWidth, window.innerHeight) < 700,
      lowPower: !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4),
      drawLogo: drawLogo, sampleLogo: sampleLogo, LOGO: LOGO, rng: rng, sstep: sstep, ease: ease, lerp: lerp, beat: beat, FONT: FONT,
      mouse: { x: 0, y: 0, sx: 0, sy: 0 },

      beatPos: function () {
        if (mode === 'side') return { x: Math.max(24, (W - 1180) / 2 + 24), y: H * 0.40, align: 'left', size: Math.max(30, Math.min(66, H * 0.062)), maxW: W * 0.44 };
        if (mode === 'stack') return { x: W * 0.06, y: H * 0.64, align: 'left', size: Math.max(26, Math.min(44, W * 0.085)), maxW: W * 0.9 };
        return W >= H ? { x: W / 2, y: H * 0.70, align: 'center', size: H * 0.058, maxW: W * 0.8 } : { x: W / 2, y: H * 0.70, align: 'center', size: W * 0.082, maxW: W * 0.9 };
      }
    };

    var ok = false;
    try { ok = V.init(api) !== false; } catch (err) { if (window.console) console.warn('intro init', err); ok = false; }
    if (!ok) { overlay.remove(); fallback(); return; }

    resize();

    if (!FILM) {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        api.mouse.x = e.clientX / window.innerWidth - 0.5; api.mouse.y = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }

    function drawAt(t, dt) {
      api.mouse.sx += (api.mouse.x - api.mouse.sx) * 0.04;
      api.mouse.sy += (api.mouse.y - api.mouse.sy) * 0.04;
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.clearRect(0, 0, W, H);
      V.draw(t, dt || 1 / 60, api);
    }

    if (FILM) {
      window.MIN_RENDER = function (t) { drawAt(t, 1 / 30); if (V.finish) V.finish(); return true; };
      window.MIN_READY = true;
      window.MIN_THEME = V.theme || 'dark';
      window.MIN_FILMTEXT = V.filmText || null;
      return;
    }

    var seen = false;
    try { seen = sessionStorage.getItem('min-intro-seen') === '1'; } catch (e) {}
    var t = 0, last = 0, speed = 1, visible = true, running = false;
    api.fadeFrom = 0;
    if (seen) { t = V.revisitAt || 6.4; api.fadeFrom = t; }
    if (reduce) { t = 12; api.fadeFrom = 0; }
    if (FROZEN !== null) { t = FROZEN; api.fadeFrom = 0; }
    if (V.prepare) V.prepare(t, api);

    function frame(ts) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
      last = ts;
      t += dt * speed;
      if (speed > 1 && t >= TEXT_AT + 0.1) speed = 1;
      if (t >= TEXT_AT) {
        reveal();
        try { sessionStorage.setItem('min-intro-seen', '1'); } catch (e) {}
      }
      drawAt(t, dt * speed);
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduce || FROZEN !== null) return;
      running = true; last = 0; requestAnimationFrame(frame);
    }
    window.addEventListener('resize', function () { resize(); if (!running) drawAt(t, 0); });
    if (reduce || FROZEN !== null) {
      drawAt(t, 0);
      if (t >= TEXT_AT) reveal();
    } else {
      start();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0.01 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    setTimeout(reveal, 13500);

    var skip = document.getElementById('intro-skip');
    if (skip) {
      skip.addEventListener('click', function () { if (t < TEXT_AT) speed = V.skipSpeed || 6; reveal(); skip.blur(); });
      document.addEventListener('min:intro-done', function () { skip.setAttribute('hidden', ''); });
      if (hero.classList.contains('is-ready')) skip.setAttribute('hidden', '');
    }
  }

  function glProgram(gl, vs, fs) {
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var k = 0; k < n; k++) { var inf = gl.getActiveUniform(p, k); u[inf.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, inf.name); }
    return { p: p, u: u };
  }
  function getGL(canvas, film) {
    try {
      return canvas.getContext('webgl2', {
        antialias: false, alpha: false, depth: false, stencil: false,
        premultipliedAlpha: false, preserveDrawingBuffer: !!film, powerPreference: 'high-performance'
      });
    } catch (e) { return null; }
  }
  var FULL_VS = '#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}';

  window.MinIntro = {
    run: run, drawLogo: drawLogo, sampleLogo: sampleLogo, LOGO: LOGO, rng: rng, beat: beat, FONT: FONT, scrim: scrim,
    sstep: sstep, ease: ease, lerp: lerp, glProgram: glProgram, getGL: getGL, FULL_VS: FULL_VS
  };
})();
