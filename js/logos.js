(function () {
  'use strict';
  var DEFAULT = 'mcheck';
  var DEFAULT_OLD = 'fold';
  var KO = '<path d="M6 14H40M6 32H37M6 50H40M6 14V50"/><path d="M56 7V61M74 3V66M56 34H74"/><path d="M8 80H72V100"/>' +
    '<g transform="translate(94 0)"><path d="M40 9L10 60M40 9L70 60"/><path d="M2 87H78"/></g>' +
    '<g transform="translate(188 0)"><path d="M6 14H46V56H6Z"/><path d="M70 3V68"/><path d="M10 76V100H72"/></g>';
  var KO_PATHS = ['M6 14H40M6 32H37M6 50H40M6 14V50', 'M56 7V61M74 3V66M56 34H74', 'M8 80H72V100', 'M134 9L104 60M134 9L164 60', 'M96 87H172', 'M194 14H234V56H194Z', 'M258 3V68', 'M198 76V100H260'];

  var LOGOS = {

    mcheck: { name: 'm + 파란 체크', tile: '#0E2139', rx: 46, acc: '#3673F7', accLight: '#3673F7', strokes: [{ d: 'M36 134V94a24 24 0 0 1 48 0v40M84 94c0-13 10.5-21 23-21c8 0 13.5 4 19 9.5L141 97', w: 27 }], accent: { l: [136, 129, 170, 95, 26] } },

    fold: { name: '접은 종이 민', tile: '#2554F0', rx: 48, toneB: '#C2D3FF', markB: '#5C82FF', fills: [
      { d: 'M49 65.15L66 65.15L66 88.95L49 88.95Z', t: 0 },
      { d: 'M93.2 65.15L110.2 65.15L110.2 88.95L93.2 105.95Z', t: 0 },
      { d: 'M49 48.15L93.2 48.15L110.2 65.15L49 65.15Z', t: 1 },
      { d: 'M49 88.95L93.2 88.95L93.2 105.95L66 105.95Z', t: 1 },
      { d: 'M127.2 39.65L144.2 39.65L144.2 119.55L127.2 119.55Z', t: 0 },
      { d: 'M62.6 121.25L79.6 121.25L79.6 143.35L62.6 143.35Z', t: 0 },
      { d: 'M62.6 143.35L147.6 143.35L147.6 160.35L79.6 160.35Z', t: 1 }] },

    fold1: { name: '접은 종이 민 1판', tile: '#2554F0', rx: 48, fills: [
      { d: 'M51 51H107L121 65V93L107 107H65L51 93ZM65 65V93H107V65Z' },
      { d: 'M135 37H149V121H135Z' },
      { d: 'M51 121H65V149H149V163H65L51 149Z' }] },

    mdot: { name: '낮아지는 m', tile: '#2554F0', acc: '#5EEAD4', accLight: '#12B886', rx: 52, strokes: [{ d: 'M41 139V85a24 24 0 0 1 48 0v54', w: 22 }, { d: 'M89 105a20 20 0 0 1 40 0v34', w: 22 }], accent: { c: [157, 139, 13] } },

    check: { name: '두 획 + 가장 낮은 점', strokes: [{ d: 'M48 94.5L75.5 121.5', w: 24 }, { d: 'M115 116.5L152 51', w: 24 }], accent: { c: [98.5, 145, 15] } },

    mieum: { name: '‘민’ 모노그램', strokes: [{ d: 'M137 42V114', w: 19 }, { d: 'M60 124V154H151', w: 19 }], accent: { r: [47, 46, 54, 54, 13] } },

    min: { name: 'min 리뉴얼', strokes: [{ d: 'M31.5 131V113a14 14 0 0 1 28 0v18', w: 17.5 }, { d: 'M59.5 113a14 14 0 0 1 28 0v18', w: 17.5 }, { d: 'M113.5 99v32', w: 17.5 }, { d: 'M139.5 131V113a14 14 0 0 1 28 0v18', w: 17.5 }], accent: { c: [113.5, 73, 10.5] } },

    curve: { name: '최저점 곡선', strokes: [{ d: 'M38 60C60 168 120 168 162 104', w: 18 }], accent: { c: [92, 122, 14] } },

    seal: { name: '현대식 도장', strokes: [{ d: 'M70 40H130A30 30 0 0 1 160 70V130A30 30 0 0 1 130 160H70A30 30 0 0 1 40 130V70A30 30 0 0 1 70 40Z', w: 8 }]
      .concat(KO_PATHS.map(function (d) { return { d: d, w: 16, t: [62, 70, 0.28] }; })), accent: { c: [146, 146, 10] } }
  };

  var qs = location.search.match(/[?&]logo=([a-z]+)/);
  function has(k) { return Object.prototype.hasOwnProperty.call(LOGOS, k); }
  var KIND = qs && has(qs[1]) ? qs[1] : (window.TM_LOGO && has(window.TM_LOGO) ? window.TM_LOGO : DEFAULT);

  function svgBody(o) {
    o = o || {};
    var L = LOGOS[o.kind || KIND], out = '', fillC = o.stroke || '#fff';
    if (o.bg === 'tile') out += '<rect width="200" height="200" rx="' + (L.rx || 58) + '" fill="' + (o.bgColor || L.tile || '#0E1626') + '"/>';
    if (o.bg === 'circle') out += '<circle cx="100" cy="100" r="100" fill="' + (o.bgColor || L.tile || '#0E1626') + '"/>';
    var fillB = o.toneB || (o.bg === 'tile' || o.bg === 'circle' ? L.toneB : (o.stroke && o.stroke !== '#fff' && o.stroke !== '#FFFFFF' && o.stroke !== 'currentColor' ? L.markB : null));
    (L.fills || []).forEach(function (f) {
      var col = f.t && fillB ? fillB : fillC, op = f.t && !fillB && L.toneB ? ' fill-opacity="0.72"' : '';
      out += '<path d="' + f.d + '" fill="' + col + '"' + op + ' fill-rule="evenodd"/>';
    });
    (L.strokes || []).forEach(function (s) {
      var tr = s.t ? ' transform="translate(' + s.t[0] + ' ' + s.t[1] + ') scale(' + s.t[2] + ')"' : '';
      out += '<path d="' + s.d + '"' + tr + ' fill="none" stroke="' + (o.stroke || '#fff') + '" stroke-width="' + s.w + '" stroke-linecap="round" stroke-linejoin="round"/>';
    });
    var a = L.accent || {}, col = o.accent || L.acc || '#3EE6A1';
    if (a.c) out += '<circle cx="' + a.c[0] + '" cy="' + a.c[1] + '" r="' + a.c[2] + '" fill="' + col + '"/>';
    if (a.r) out += '<rect x="' + a.r[0] + '" y="' + a.r[1] + '" width="' + a.r[2] + '" height="' + a.r[3] + '" rx="' + a.r[4] + '" fill="' + col + '"/>';
    if (a.l) {
      var ld = 'M' + a.l[0] + ' ' + a.l[1] + 'L' + a.l[2] + ' ' + a.l[3];
      if (o.bg === 'tile' || o.bg === 'circle') out += '<path d="' + ld + '" fill="none" stroke="' + (L.tile || '#0E2139') + '" stroke-opacity=".16" stroke-width="' + (a.l[4] + 6) + '" stroke-linecap="round"/>';
      out += '<path d="' + ld + '" fill="none" stroke="' + col + '" stroke-width="' + a.l[4] + '" stroke-linecap="round"/>';
    }
    return out;
  }
  function svg(o, attrs) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"' + (attrs || '') + '>' + svgBody(o) + '</svg>'; }

  var cache = {};
  function prep(kind) {
    if (cache[kind]) return cache[kind];
    var L = LOGOS[kind], items = [], total = 0, fills = [];
    var tones = [];
    (L.fills || []).forEach(function (f) { try { fills.push(new Path2D(f.d)); tones.push(f.t || 0); } catch (e) {} });
    (L.strokes || []).forEach(function (s) {
      var len = 80;
      try {
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', s.d);
        len = (el.getTotalLength ? el.getTotalLength() : 80) * (s.t ? s.t[2] : 1) || 80;
      } catch (e) {}
      var p = null; try { p = new Path2D(s.d); } catch (e) {}
      items.push({ s: s, p: p, len: len }); total += len;
    });
    return (cache[kind] = { L: L, items: items, total: total, fills: fills, tones: tones });
  }
  function draw(ctx, o) {
    var P = prep(o.kind || KIND), d = o.draw == null ? 1 : o.draw;
    ctx.translate(-100, -100);
    if (d > 0 && P.fills.length) {
      ctx.save(); ctx.fillStyle = o.stroke || '#FFFFFF';
      var base = ctx.globalAlpha;
      P.fills.forEach(function (f, i) { var k = Math.min(1, Math.max(0, d * P.fills.length - i)); if (k <= 0) return; ctx.globalAlpha = base * k * (P.tones[i] ? 0.74 : 1); ctx.fill(f, 'evenodd'); });
      ctx.restore();
    }
    if (d > 0) {
      ctx.strokeStyle = o.stroke || '#FFFFFF'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var left = P.total * d;
      for (var i = 0; i < P.items.length && left > 0.3; i++) {
        var it = P.items[i], part = Math.min(it.len, left);
        if (!it.p) continue;
        ctx.save();
        if (it.s.t) { ctx.translate(it.s.t[0], it.s.t[1]); ctx.scale(it.s.t[2], it.s.t[2]); }
        var k = it.s.t ? it.s.t[2] : 1;
        ctx.lineWidth = it.s.w;
        if (d < 1) ctx.setLineDash([part / k, it.len / k + 4]);
        ctx.stroke(it.p);
        ctx.restore();
        left -= it.len;
      }
    }
    var A = o.dotAlpha == null ? 1 : o.dotAlpha;
    if (A > 0) {
      var a = P.L.accent || {}, sc = o.dotScale == null ? 1 : o.dotScale;
      ctx.save(); ctx.globalAlpha *= A; ctx.fillStyle = o.dot || '#3EE6A1';
      if (a.c) { ctx.beginPath(); ctx.arc(a.c[0], a.c[1], a.c[2] * sc, 0, Math.PI * 2); ctx.fill(); }
      if (a.r) {
        var cx = a.r[0] + a.r[2] / 2, cy = a.r[1] + a.r[3] / 2, w = a.r[2] * sc, h = a.r[3] * sc;
        ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, a.r[4] * sc); ctx.fill();
      }
      if (a.l) { ctx.strokeStyle = o.dot || P.L.acc || '#3673F7'; ctx.lineCap = 'round'; ctx.lineWidth = a.l[4] * sc; ctx.beginPath(); ctx.moveTo(a.l[0], a.l[1]); ctx.lineTo(a.l[2], a.l[3]); ctx.stroke(); }
      ctx.restore();
    }
  }

  var STORY = {
    mcheck: ['Tax + min.<br>m 끝에 찍은 파란 체크.', [['m', 'min — 세금을 최소로, 세무회계 민'], ['파란 체크', '두 세무사가 한 번 더 확인했다는 표시']]],
    fold: ['Tax + min.<br>영수증을 접어 만든 ‘민’.', [['ㅁ · ㅣ · ㄴ', '영수증·카드 전표·납부서를 한 장씩 접어 세운 세 획'], ['두 가지 파랑', '세로 획은 진하게, 접어 넘긴 가로 획은 밝게 — 종이를 직접 접은 자리, 한 장도 흘리지 않고 정리했다는 표시']]],
    fold1: ['Tax + min.<br>영수증을 접어 만든 ‘민’.', [['ㅁ · ㅣ · ㄴ', '영수증·카드 전표·납부서를 한 장씩 접어 세운 세 획'], ['비스듬한 모서리', '종이를 직접 접은 자리']]],
    mdot: ['Tax + min.<br>두 번째 언덕이 더 낮은 m.', [['낮아지는 m', '언덕이 한 번 더 낮아지는 m — 줄어드는 세금'], ['민트 점', '‘최소’에 찍는 마침표, min.']]],
    check: ['Tax + min.<br>두 획이 만나는 가장 낮은 점.', [['두 획', '이민기·변진웅 두 세무사'], ['만나는 점', '두 사람이 함께 확인해 찾아가는 ‘최소’의 자리']]],
    mieum: ['Tax + min.<br>‘민’ 한 글자에 담은 약속.', [['민트 네모(ㅁ)', '사장님의 장부를 빈틈없이 담는 상자'], ['ㅣ 와 ㄴ', '옆과 아래에서 받치는 두 세무사']]],
    min: ['Tax + min.<br>세금을 최소(min)로.', [['min', '세무회계 민, 그리고 ‘최소’'], ['민트 점', '마지막까지 확인했다는 마침표']]],
    curve: ['Tax + min.<br>곡선이 가장 낮아지는 자리.', [['곡선', '1년 동안 오르내리는 세금의 흐름'], ['공', '공제·감면을 다 챙겼을 때 멈추는 가장 낮은 자리']]],
    seal: ['Tax + min.<br>확인했다는 도장.', [['도장', '신고서마다 책임지고 확인한다는 표시'], ['민트 점', '다른 세무사가 한 번 더 본 두 번째 확인']]]
  };
  function story() {
    var t = document.getElementById('ls-title'), c = document.getElementById('ls-cap'), art = document.getElementById('ls-art');
    var S = STORY[KIND], L = LOGOS[KIND];
    if (t) t.innerHTML = S[0];
    if (c) c.innerHTML = S[1].map(function (r) { return '<p><b>' + r[0] + '</b> ' + r[1] + '</p>'; }).join('');
    if (art) {
      var h = '', n = (L.strokes || []).length;
      (L.fills || []).forEach(function (f, i) {
        h += '<path class="ls-dot" fill-rule="evenodd" d="' + f.d + '" style="--d:' + (0.3 + i * 0.16).toFixed(2) + 's;fill:' + (f.t ? (L.toneB || '#fff') : '#fff') + ';stroke:none"/>';
      });
      (L.strokes || []).forEach(function (st, i) {
        var tr = st.t ? ' transform="translate(' + st.t[0] + ' ' + st.t[1] + ') scale(' + st.t[2] + ')"' : '';
        h += '<path class="ls-s" pathLength="1" d="' + st.d + '"' + tr + ' stroke-width="' + st.w + '" style="--d:' + (0.3 + i * Math.min(0.45, 1.2 / n)).toFixed(2) + 's"/>';
      });
      var a = L.accent || {}, dd = (0.6 + Math.min(1.3, n * 0.45)).toFixed(2);
      if (a.c) h += '<circle class="ls-dot" cx="' + a.c[0] + '" cy="' + a.c[1] + '" r="' + a.c[2] + '" style="--d:' + dd + 's"/>';
      if (a.r) h += '<rect class="ls-dot" x="' + a.r[0] + '" y="' + a.r[1] + '" width="' + a.r[2] + '" height="' + a.r[3] + '" rx="' + a.r[4] + '" style="--d:' + dd + 's"/>';
      if (a.l) h += '<path class="ls-s" pathLength="1" d="M' + a.l[0] + ' ' + a.l[1] + 'L' + a.l[2] + ' ' + a.l[3] + '" stroke-width="' + a.l[4] + '" style="--d:' + dd + 's;stroke:' + (L.acc || '#3673F7') + '"/>';
      var box = art.closest ? art.closest('.logo-story-art') : null;
      if (box && L.tile) box.style.background = L.tile;
      art.innerHTML = h;
    }
  }

  function apply() {
    if (KIND === DEFAULT) { story(); return; }
    var sym = document.getElementById('tm-symbol'), mark = document.getElementById('tm-mark');
    if (sym) sym.innerHTML = svgBody({ bg: 'tile' });
    if (mark) mark.innerHTML = svgBody({ bg: 'none', stroke: 'currentColor', accent: 'var(--dot, ' + (LOGOS[KIND].accLight || '#3EE6A1') + ')' });
    var fb = document.querySelector('.hero-fallback svg');
    if (fb) fb.innerHTML = svgBody({ bg: 'tile' });
    story();
    var ico = document.querySelector('link[rel="icon"]');
    if (ico && KIND !== DEFAULT) ico.href = 'data:image/svg+xml,' + encodeURIComponent(svg({ bg: 'tile' }));
  }

  window.TaxminLogo = { LOGOS: LOGOS, KIND: KIND, svg: svg, svgBody: svgBody, draw: draw, apply: apply };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
