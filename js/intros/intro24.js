(function () {
  'use strict';
  var M = window.MinIntro;
  var gl, P = {}, VAO = {}, BUF = {}, FB = null, FBW = 0, FBH = 0, ANISO = null, PROPS = [], CALC_TEX = null;
  var EPS = 0.15;
  var PXU = 6;
  var GLYPH_C = [60, 61], GLYPH_H = 142;
  var MAT = [20, 0, 215, 155];
  var SH = [0.30, -0.40];
  var LIGHT = norm3([-0.30, 0.40, 1.0]);
  var BLUE = '#2554F0', INK = '#283044', MUTE = '#7A8397';
  var WASH = /[?&]paper=white/.test(location.search) ? 0 : 1;

  var PAPERS = [
    { key: 'receipt', rect: [-20, 0, 40, 232], pivot: [38, 35], back: [0.965, 0.972, 0.984],
      uv: function (x, y) { return [(x + 20) / 60, y / 232]; },
      folds: [
        { p: [0, 0], d: [0, 1], m: [-10, 50], t: [0.52, 0.88] },
        { p: [20, 0], d: [0, 1], m: [30, 50], t: [0.88, 1.24] },
        { p: [0, 50], d: [1, 1], m: [0, 200], t: [1.80, 2.12] },
        { p: [56, 70], d: [1, -1], m: [200, 200], t: [2.12, 2.44] },
        { p: [56, 0], d: [1, 1], m: [100, -100], t: [2.44, 2.76] }
      ],
      wide: { c: [-38, 70], r: 8 }, tall: { c: [8, 32], r: 7 },
      enter: { d: [-170, 120], r: 14, t: 0.00 }, move: [1.30, 3.05], seed: 1.3 },
    { key: 'card', rect: [76, -10, 136, 178], pivot: [106, 37], back: [0.955, 0.965, 0.98],
      uv: function (x, y) { return [(x - 76) / 60, (y + 10) / 188]; },
      folds: [
        { p: [0, 84], d: [1, 0], m: [106, 150], t: [0.64, 1.04] },
        { p: [96, 0], d: [0, 1], m: [86, 0], t: [1.10, 1.42] },
        { p: [116, 0], d: [0, 1], m: [126, 0], t: [1.42, 1.74] }
      ],
      wide: { c: [92, 40], r: -6 }, tall: { c: [114, 26], r: -6 },
      enter: { d: [30, 240], r: -12, t: 0.07 }, move: [1.55, 3.10], seed: 2.7 },
    { key: 'slip', rect: [16, 88, 96, 216], pivot: [68, 110], back: [0.925, 0.945, 0.99],
      uv: function (x, y) { return [(y - 88) / 128, (96 - x) / 80]; },
      folds: [
        { p: [56, 0], d: [0, 1], m: [76, 0], t: [0.74, 1.10] },
        { p: [36, 0], d: [0, 1], m: [46, 0], t: [1.10, 1.46] },
        { p: [16, 112], d: [1, 1], m: [16, 200], t: [2.25, 2.60] }
      ],
      wide: { c: [206, 112], r: 84 }, tall: { c: [56, 224], r: 86 },
      enter: { d: [190, 110], r: 12, t: 0.14 }, move: [1.45, 3.15], seed: 4.1 }
  ];

  var PARTS = [
    [0, [[0, 20], [20, 20], [20, 48], [0, 48]]], [0, [[52, 20], [72, 20], [72, 48], [52, 68]]],
    [1, [[0, 0], [52, 0], [72, 20], [0, 20]]], [1, [[0, 48], [52, 48], [52, 68], [20, 68]]],
    [0, [[92, -10], [112, -10], [112, 84], [92, 84]]],
    [0, [[16, 86], [36, 86], [36, 112], [16, 112]]], [1, [[16, 112], [116, 112], [116, 132], [36, 132]]]
  ];

  function norm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function unit2(v) { var l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }
  function side(d, p, q) { return d[0] * (q[1] - p[1]) - d[1] * (q[0] - p[0]); }
  function aff(A, v) { return [A[0] * v[0] + A[1] * v[1] + A[2], A[3] * v[0] + A[4] * v[1] + A[5]]; }
  function amul(R, A) {
    return [R[0] * A[0] + R[1] * A[3], R[0] * A[1] + R[1] * A[4], R[0] * A[2] + R[1] * A[5] + R[2],
            R[3] * A[0] + R[4] * A[3], R[3] * A[1] + R[4] * A[4], R[3] * A[2] + R[4] * A[5] + R[5]];
  }
  function reflM(p, d) {
    var a = 2 * d[0] * d[0] - 1, b = 2 * d[0] * d[1], e = 2 * d[1] * d[1] - 1;
    return [a, b, p[0] - (a * p[0] + b * p[1]), b, e, p[1] - (b * p[0] + e * p[1])];
  }
  function clipPoly(v, s, sg) {
    var out = [], n = v.length;
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n, si = s[i] * sg, sj = s[j] * sg;
      if (si >= -1e-9) out.push(v[i]);
      if ((si > 1e-9 && sj < -1e-9) || (si < -1e-9 && sj > 1e-9)) {
        var k = si / (si - sj);
        out.push([v[i][0] + (v[j][0] - v[i][0]) * k, v[i][1] + (v[j][1] - v[i][1]) * k]);
      }
    }
    return out;
  }
  function area(v) { var a = 0; for (var i = 0; i < v.length; i++) { var j = (i + 1) % v.length; a += v[i][0] * v[j][1] - v[j][0] * v[i][1]; } return Math.abs(a / 2); }
  function inside(pt, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      if (((poly[i][1] > pt[1]) !== (poly[j][1] > pt[1])) && (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])) c = !c;
    }
    return c;
  }

  function rotL(q, p, h, a, c, s) {
    var rx = q[0] - p[0], ry = q[1] - p[1], rz = q[2] - h, dt = a[0] * rx + a[1] * ry;
    return [p[0] + rx * c + a[1] * rz * s + a[0] * dt * (1 - c),
            p[1] + ry * c - a[0] * rz * s + a[1] * dt * (1 - c),
            h + rz * c + (a[0] * ry - a[1] * rx) * s];
  }

  function build(D) {
    var r = D.rect, zmax = 0;
    var polys = [{ v: [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], A: [1, 0, 0, 0, 1, 0], z: 0, mv: [] }];
    D.folds.forEach(function (f, k) {
      var p = f.p, d = unit2(f.d), sm = side(d, p, f.m) > 0 ? 1 : -1, h = zmax + EPS / 2, out = [];
      polys.forEach(function (pg) {
        var s = pg.v.map(function (v) { return side(d, p, aff(pg.A, v)) * sm; });
        var pos = clipPoly(pg.v, s, 1), neg = clipPoly(pg.v, s, -1);
        if (pos.length >= 3 && area(pos) > 1e-3) out.push({ v: pos, A: pg.A, z: pg.z, mv: pg.mv.concat([true]) });
        if (neg.length >= 3 && area(neg) > 1e-3) out.push({ v: neg, A: pg.A, z: pg.z, mv: pg.mv.concat([false]) });
      });
      var rm = [f.m[0] - p[0], f.m[1] - p[1]], a = d;
      if (a[0] * rm[1] - a[1] * rm[0] < 0) a = [-a[0], -a[1]];
      f.a = a; f.h = h;
      out.forEach(function (pg) { if (pg.mv[k]) { pg.A = amul(reflM(p, d), pg.A); pg.z = 2 * h - pg.z; } zmax = Math.max(zmax, pg.z); });
      polys = out;
    });
    polys.forEach(function (pg) {
      var cx = 0, cy = 0; pg.v.forEach(function (v) { cx += v[0]; cy += v[1]; });
      var fc = aff(pg.A, [cx / pg.v.length, cy / pg.v.length]);
      pg.tone = 0;
      for (var i = 0; i < PARTS.length; i++) if (inside(fc, PARTS[i][1])) { pg.tone = PARTS[i][0]; break; }
    });
    D.polys = polys;
  }
  PAPERS.forEach(build);

  function m4mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s;
    }
    return o;
  }
  function persp(fy, asp, n, f) { var t = 1 / Math.tan(fy / 2), nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; }
  function lookAt(e, c, u) {
    var z = norm3([e[0] - c[0], e[1] - c[1], e[2] - c[2]]);
    var x = norm3([u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]);
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
  }
  function m4inv(m) {
    var a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    var a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    var b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    det = det ? 1 / det : 0;
    return new Float32Array([
      (a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det,
      (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det,
      (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det,
      (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det]);
  }

  function canvasOf(w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  function writer(x) {
    return function (s, X, Y, size, wt, col, al) { x.font = (wt || 600) + ' ' + size + 'px ' + M.FONT; x.fillStyle = col || INK; x.textAlign = al || 'left'; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y); };
  }
  function dashLine(x, x0, x1, y, col) { x.save(); x.strokeStyle = col || '#BAC1CF'; x.setLineDash([7, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke(); x.restore(); }
  function barcode(x, X, Y, w, h, seed, col) {
    var rnd = M.rng(seed), cx = X; x.fillStyle = col || INK;
    while (cx < X + w) { var bw = 2 + Math.floor(rnd() * 3) * 2; if (rnd() > 0.38) x.fillRect(cx, Y, bw, h); cx += bw + 2 + Math.floor(rnd() * 2) * 2; }
  }
  function grain(x, w, h, seed, a) {
    var rnd = M.rng(seed); x.save(); x.globalAlpha = a;
    for (var i = 0; i < w * h / 90; i++) { x.fillStyle = rnd() > 0.5 ? '#E9EDF3' : '#FFFFFF'; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1); }
    x.restore();
  }
  function texReceipt() {
    return canvasOf(60 * PXU, 232 * PXU, function (x, w, h) {
      var T = writer(x), L = 26, R = w - 26, y = 88;
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); grain(x, w, h, 3, 0.7);
      T('영 수 증', w / 2, y, 40, 800, INK, 'center'); y += 30;
      T('R E C E I P T', w / 2, y, 14, 700, MUTE, 'center'); y += 28; dashLine(x, 22, w - 22, y); y += 40;
      [['상호', '○○문구 강서점'], ['일시', '2026-10-17 14:32'], ['사업자', '***-**-*****'], ['번호', '0042']].forEach(function (r) { T(r[0], L, y, 18, 600, MUTE); T(r[1], R, y, 18, 600, INK, 'right'); y += 32; });
      dashLine(x, 22, w - 22, y - 6); y += 34;
      T('품명', L, y, 16, 700, MUTE); T('수량', w * 0.64, y, 16, 700, MUTE, 'center'); T('금액', R, y, 16, 700, MUTE, 'right'); y += 38;
      [['A4 복사용지', 1, '24,500'], ['볼펜 세트', 2, '7,800'], ['파일 바인더', 3, '8,700'], ['택배 발송', 1, '4,000'], ['커피 원두', 1, '18,000'], ['포스트잇', 4, '6,400']].forEach(function (r) {
        T(r[0], L, y, 19, 600, INK); T(String(r[1]), w * 0.64, y, 19, 600, INK, 'center'); T(r[2], R, y, 19, 700, INK, 'right'); y += 37;
      });
      dashLine(x, 22, w - 22, y - 8); y += 30;
      T('공급가액', L, y, 18, 600, MUTE); T('63,091', R, y, 18, 600, INK, 'right'); y += 32;
      T('부가세', L, y, 18, 600, MUTE); T('6,309', R, y, 18, 600, INK, 'right'); y += 50;
      T('합계', L, y, 23, 800, INK); T('69,400', R, y, 42, 800, INK, 'right'); y += 28; dashLine(x, 22, w - 22, y); y += 38;
      [['결제', '신용카드(일시불)'], ['승인번호', '********'], ['카드', '****-****-****-5820']].forEach(function (r) { T(r[0], L, y, 17, 600, MUTE); T(r[1], R, y, 17, 600, INK, 'right'); y += 30; });
      dashLine(x, 22, w - 22, y - 6); y += 32;
      T('교환·환불은 영수증 지참 시 7일 이내', w / 2, y, 15, 600, MUTE, 'center'); y += 30;
      barcode(x, 44, y, w - 88, 64, 7); y += 92;
      T('2 0 2 6 1 0 1 7 0 0 4 2', w / 2, y, 15, 700, INK, 'center'); y += 50;
      T('감사합니다', w / 2, y, 21, 800, INK, 'center');
      dashLine(x, 10, w - 10, h - 34, '#CBD1DC');
    });
  }
  function texCard() {
    return canvasOf(60 * PXU, 188 * PXU, function (x, w, h) {
      var T = writer(x), L = 26, R = w - 26, y = 86;
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); grain(x, w, h, 5, 0.7);
      x.fillStyle = BLUE; x.fillRect(0, 0, w, 14);
      T('카드 매출전표', w / 2, y, 32, 800, INK, 'center'); y += 30;
      T('(고객용)', w / 2, y, 16, 600, MUTE, 'center'); y += 26; dashLine(x, 22, w - 22, y); y += 40;
      [['카드종류', '신용'], ['카드번호', '****-****-****-1234'], ['거래일시', '2026/10/17 09:12'], ['승인번호', '3018****'], ['할부', '일시불']].forEach(function (r) { T(r[0], L, y, 17, 600, MUTE); T(r[1], R, y, 17, 600, INK, 'right'); y += 32; });
      dashLine(x, 22, w - 22, y - 6); y += 36;
      [['판매금액', '30,000'], ['부가세', '3,000'], ['봉사료', '0']].forEach(function (r) { T(r[0], L, y, 18, 600, MUTE); T(r[1], R, y, 18, 700, INK, 'right'); y += 34; });
      y += 20; T('합계', L, y, 23, 800, INK); T('33,000', R, y, 44, 800, BLUE, 'right'); y += 28; dashLine(x, 22, w - 22, y); y += 40;
      [['가맹점명', '○○식당'], ['사업자번호', '***-**-*****']].forEach(function (r) { T(r[0], L, y, 17, 600, MUTE); T(r[1], R, y, 17, 600, INK, 'right'); y += 32; });
      dashLine(x, 22, w - 22, y - 6); y += 46;
      T('서명', L, y, 17, 700, MUTE);
      x.strokeStyle = INK; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(110, y + 6);
      x.bezierCurveTo(140, y - 38, 170, y + 28, 200, y - 8); x.bezierCurveTo(222, y - 28, 236, y + 16, 270, y - 4); x.lineTo(316, y - 10); x.stroke();
      y += 22; x.strokeStyle = '#D5DAE4'; x.lineWidth = 2; x.beginPath(); x.moveTo(100, y); x.lineTo(R, y); x.stroke(); y += 50;
      T('위 거래를 확인합니다', w / 2, y, 16, 600, MUTE, 'center'); y += 40;
      barcode(x, 60, y, w - 120, 50, 23);
      dashLine(x, 10, w - 10, h - 30, '#CBD1DC');
    });
  }
  function texSlip() {
    return canvasOf(128 * PXU, 80 * PXU, function (x, w, h) {
      var T = writer(x);
      x.fillStyle = '#F6F9FF'; x.fillRect(0, 0, w, h); grain(x, w, h, 9, 0.5);
      x.strokeStyle = BLUE; x.lineWidth = 3; x.strokeRect(14, 14, w - 28, h - 28);
      x.fillStyle = BLUE; x.fillRect(14, 14, w - 28, 62);
      T('국세 납부서', 34, 56, 30, 800, '#FFFFFF'); T('납세자 보관용', w - 34, 54, 17, 700, 'rgba(255,255,255,.85)', 'right');
      var rows = [['세목', '부가가치세'], ['과세기간', '2026년 2기 예정'], ['납부기한', '2026. 10. 26.'], ['납세자', '○○상사']];
      var top = 76, rh = 44;
      x.fillStyle = '#E6EDFF'; x.fillRect(14, top, 124, rh * rows.length);
      rows.forEach(function (r, i) {
        var yy = top + i * rh;
        x.strokeStyle = '#A9BEF9'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(14, yy + rh); x.lineTo(470, yy + rh); x.stroke();
        T(r[0], 30, yy + 29, 17, 700, '#3653C9'); T(r[1], 152, yy + 29, 18, 700, INK);
      });
      x.strokeStyle = '#A9BEF9'; x.beginPath(); x.moveTo(138, top); x.lineTo(138, top + rh * rows.length); x.moveTo(470, top); x.lineTo(470, top + rh * rows.length); x.stroke();
      x.strokeStyle = BLUE; x.lineWidth = 3; x.strokeRect(490, 92, 262, 150);
      T('납부할 세액', 508, 128, 19, 700, '#3653C9');
      T('1,284,000', 716, 204, 44, 800, BLUE, 'right'); T('원', 738, 204, 18, 700, BLUE, 'right');
      barcode(x, 490, 262, 262, 60, 41, '#1C2A55');
      T('0126 1017 2554 0012 8400', 30, 428, 19, 700, '#3C4864');
      x.save(); x.strokeStyle = 'rgba(37,84,240,.55)'; x.setLineDash([5, 5]); x.lineWidth = 2.5; x.beginPath(); x.arc(420, 404, 30, 0, Math.PI * 2); x.stroke(); x.restore();
      T('수납인', 420, 410, 15, 700, 'rgba(37,84,240,.7)', 'center');
    });
  }
  function texCalc() {
    return canvasOf(368, 536, function (x, w, h) {
      x.fillStyle = '#E9EDF3'; x.fillRect(0, 0, w, h);
      var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#C9D3DF'; x.beginPath(); x.roundRect(28, 30, w - 56, 104, 12); x.fill();
      x.fillStyle = '#DCE4EC'; x.beginPath(); x.roundRect(34, 36, w - 68, 92, 9); x.fill();
      x.font = '700 50px ' + M.FONT; x.fillStyle = '#26324F'; x.textAlign = 'right'; x.fillText('1,284,000', w - 48, 104);
      var keys = ['C', '÷', '×', '−', '7', '8', '9', '+', '4', '5', '6', '%', '1', '2', '3', '=', '0', '00', '.', ''];
      for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) {
        if (r === 4 && c === 3) continue;
        var k = keys[r * 4 + c], kx = 30 + c * 80, ky = 162 + r * 72, blue = (c === 3 && r === 3);
        var kh = blue ? 128 : 58;
        x.fillStyle = 'rgba(30,45,80,.18)'; x.beginPath(); x.roundRect(kx, ky + 4, 68, kh, 12); x.fill();
        x.fillStyle = blue ? BLUE : (c === 3 || r === 0 ? '#D3DAE4' : '#FFFFFF'); x.beginPath(); x.roundRect(kx, ky, 68, kh, 12); x.fill();
        x.font = '700 24px ' + M.FONT; x.fillStyle = blue ? '#FFFFFF' : '#2B3550'; x.textAlign = 'center'; x.fillText(k, kx + 34, ky + kh / 2 + 9);
      }
    });
  }

  var VS_PAPER = '#version 300 es\nlayout(location=0) in vec3 aP;layout(location=1) in vec3 aN;layout(location=2) in vec2 aT;layout(location=3) in float aK;uniform mat4 uVP;out vec3 vP;out vec3 vN;out vec2 vT;out float vK;void main(){vP=aP;vN=aN;vT=aT;vK=aK;gl_Position=uVP*vec4(aP,1.0);}';
  var FS_PAPER = '#version 300 es\nprecision highp float;in vec3 vP;in vec3 vN;in vec2 vT;in float vK;uniform sampler2D uTex;uniform vec3 uEye;uniform vec3 uBack;uniform vec3 uL;uniform float uSheen;uniform float uSweep;uniform float uWash;uniform float uWashAmt;out vec4 o;' +
    'void main(){vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);bool fr=dot(N,V)>0.0;if(!fr)N=-N;' +
    'vec3 tx=texture(uTex,vT).rgb;float ink=1.0-dot(tx,vec3(0.299,0.587,0.114));' +
    'vec3 base=fr?tx:uBack*(1.0-0.07*ink);' +
    'float wd=vP.x*0.8-vP.y*0.6;float wa=1.0-smoothstep(uWash-24.0,uWash+24.0,wd);' +
    'float lum=dot(tx,vec3(0.299,0.587,0.114));vec3 blue=mix(vec3(0.145,0.329,0.941),vec3(0.361,0.510,1.0),vK)*(0.95+0.05*lum)+ink*0.06;base=mix(base,blue,wa*uWashAmt);' +
    'float df=max(dot(N,uL),0.0);vec3 H=normalize(uL+V);float sp=pow(max(dot(N,H),0.0),48.0);' +
    'vec3 c=base*(0.70+0.36*df)+vec3(sp*0.07);float sw=exp(-pow((vP.x*0.8+vP.y*0.35-uSweep)/26.0,2.0))*uSheen;c+=vec3(0.06,0.08,0.12)*sw;' +
    'o=vec4(min(c,vec3(1.0)),1.0);}';
  var FS_PROP = '#version 300 es\nprecision highp float;in vec3 vP;in vec3 vN;in vec2 vT;in float vK;uniform sampler2D uTex;uniform vec3 uEye;uniform vec3 uL;uniform vec3 uColor;uniform float uUseTex;uniform float uSpec;uniform vec2 uRes;uniform float uLeft;uniform float uBottom;out vec4 o;' +
    'void main(){vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);if(dot(N,V)<0.0)N=-N;' +
    'vec3 base=uUseTex>0.5?texture(uTex,vT).rgb:uColor;float df=max(dot(N,uL),0.0);vec3 H=normalize(uL+V);float sp=pow(max(dot(N,H),0.0),70.0);' +
    'vec3 c=base*(0.66+0.40*df)+vec3(sp*uSpec);vec2 uv=gl_FragCoord.xy/uRes;' +
    'c=mix(c,vec3(0.972,0.976,0.985),uLeft*(1.0-smoothstep(0.28,0.6,uv.x))*0.9);c=mix(c,vec3(0.972,0.976,0.985),uBottom*(1.0-smoothstep(0.30,0.62,uv.y))*0.9);' +
    'o=vec4(min(c,vec3(1.0)),1.0);}';
  var VS_LINE = '#version 300 es\nlayout(location=0) in vec3 aP;uniform mat4 uVP;void main(){gl_Position=uVP*vec4(aP,1.0);}';
  var FS_LINE = '#version 300 es\nprecision mediump float;uniform vec4 uC;out vec4 o;void main(){o=uC;}';
  var VS_SHADOW = '#version 300 es\nlayout(location=0) in vec3 aP;uniform mat4 uVP;uniform vec2 uSh;out float vZ;void main(){vZ=aP.z;gl_Position=uVP*vec4(aP.xy+uSh*aP.z,0.0,1.0);}';
  var FS_SHADOW = '#version 300 es\nprecision mediump float;in float vZ;out vec4 o;void main(){o=vec4(clamp(1.0-vZ/320.0,0.3,1.0),clamp(1.0-vZ/14.0,0.0,1.0),0.0,1.0);}';
  var FS_BLUR = '#version 300 es\nprecision highp float;uniform sampler2D uS;uniform vec2 uR;uniform vec2 uG;uniform vec2 uSize;out vec4 o;' +
    'void main(){vec2 uv=gl_FragCoord.xy/uSize;float w[5]=float[](0.227027,0.1945946,0.1216216,0.054054,0.016216);' +
    'float r=texture(uS,uv).r*w[0];float g=texture(uS,uv).g*w[0];' +
    'for(int i=1;i<5;i++){float f=float(i);r+=(texture(uS,uv+uR*f).r+texture(uS,uv-uR*f).r)*w[i];g+=(texture(uS,uv+uG*f).g+texture(uS,uv-uG*f).g)*w[i];}' +
    'o=vec4(r,g,0.0,1.0);}';

  var FS_BG = '#version 300 es\nprecision highp float;uniform vec2 uRes;uniform mat4 uInv;uniform sampler2D uS;uniform vec4 uMat;uniform float uLeft;uniform float uBottom;out vec4 o;' +
    'float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float ns(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),u.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),u.x),u.y);}' +
    'float sdb(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}' +
    'void main(){vec2 uv=gl_FragCoord.xy/uRes;vec2 nd=uv*2.0-1.0;vec4 a=uInv*vec4(nd,-1.0,1.0);vec4 b=uInv*vec4(nd,1.0,1.0);a/=a.w;b/=b.w;' +
    'float tt=-a.z/(b.z-a.z);vec2 hp=(a.xyz+(b.xyz-a.xyz)*tt).xy;vec2 fw=max(fwidth(hp),vec2(0.001));' +
    'vec3 desk=vec3(0.953,0.958,0.966);float n=ns(hp*0.03)*0.55+ns(hp*vec2(0.02,0.25))*0.3+ns(hp*0.8)*0.15;desk*=0.985+0.025*n;' +
    'desk*=1.0+0.04*clamp(1.0-length((hp-vec2(-300.0,260.0))/620.0),0.0,1.0);' +
    'vec2 mp=hp-uMat.xy;float d=sdb(mp,uMat.zw,16.0);' +
    'desk*=1.0-0.10*exp(-max(d,0.0)/3.0)*step(0.0,d);' +
    'vec3 mc=vec3(0.858,0.882,0.922)*(0.992+0.016*ns(hp*0.7));vec2 g=mp+uMat.zw;' +
    'vec2 g10=abs(fract(g/10.0+0.5)-0.5)*10.0;float l10=1.0-smoothstep(0.12,0.12+fw.x*1.3,min(g10.x,g10.y));' +
    'vec2 g50=abs(fract(g/50.0+0.5)-0.5)*50.0;float l50=1.0-smoothstep(0.4,0.4+fw.x*1.3,min(g50.x,g50.y));' +
    'float inr=smoothstep(10.0,12.0,-d);mc=mix(mc,vec3(0.955,0.965,0.985),(l10*0.12+l50*0.26)*inr);' +
    'float tk=step(-d,9.0)*step(2.0,-d);float tick=tk*l10;mc=mix(mc,vec3(0.955,0.965,0.985),tick*0.35);' +
    'float rim=1.0-smoothstep(0.0,1.6,-d);mc*=1.0-0.06*rim;' +
    'float am=clamp(0.5-d/(fw.x*1.2),0.0,1.0);vec3 c=mix(desk,mc,am);' +
    'vec2 s=texture(uS,uv).rg;float sh=clamp(s.r*0.50+s.g*0.56,0.0,0.92);c*=vec3(1.0)-sh*vec3(0.30,0.26,0.15);' +
    'c=mix(c,vec3(0.972,0.976,0.985),uLeft*(1.0-smoothstep(0.22,0.56,uv.x))*0.82);c=mix(c,vec3(0.972,0.976,0.985),uBottom*(1.0-smoothstep(0.30,0.62,uv.y))*0.85);' +
    'c*=1.0-0.05*length(uv-0.5);o=vec4(c,1.0);}';

  function texFrom(cv) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (ANISO) gl.texParameterf(gl.TEXTURE_2D, ANISO.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ANISO.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  }
  function makeTextures() {
    var cv = [texReceipt(), texCard(), texSlip()];
    PAPERS.forEach(function (D, i) { if (D.tex) gl.deleteTexture(D.tex); D.tex = texFrom(cv[i]); });
    if (CALC_TEX) gl.deleteTexture(CALC_TEX);
    CALC_TEX = texFrom(texCalc());
  }
  function target(w, h) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t: t, f: f };
  }
  function ensureFB(cw, ch) {
    var w = Math.max(1, Math.ceil(cw / 4)), h = Math.max(1, Math.ceil(ch / 4));
    if (FB && FBW === w && FBH === h) return;
    if (FB) FB.forEach(function (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); });
    FB = [target(w, h), target(w, h)]; FBW = w; FBH = h;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function buildProps() {
    var V = [], items = [];
    function tri(a, b, c, n, ta, tb, tc) { [[a, ta], [b, tb], [c, tc]].forEach(function (q) { V.push(q[0][0], q[0][1], q[0][2], n[0], n[1], n[2], q[1] ? q[1][0] : 0, q[1] ? q[1][1] : 0, 0); }); }
    function quad(a, b, c, d, n, uv) { tri(a, b, c, n, uv && uv[0], uv && uv[1], uv && uv[2]); tri(a, c, d, n, uv && uv[0], uv && uv[2], uv && uv[3]); }
    function begin() { return V.length / 9; }
    function end(st, o) { o.first = st; o.count = V.length / 9 - st; items.push(o); }

    function box(cx, cy, w, h, hz, ang) {
      var c = Math.cos(ang), s = Math.sin(ang);
      function Pt(x, y, z) { return [cx + x * c - y * s, cy + x * s + y * c, z]; }
      var st = begin();
      quad(Pt(-w / 2, h / 2, hz), Pt(w / 2, h / 2, hz), Pt(w / 2, -h / 2, hz), Pt(-w / 2, -h / 2, hz), [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      end(st, { tex: true, spec: 0.06 });
      st = begin();
      var sides = [[[-w / 2, -h / 2], [w / 2, -h / 2], [0, -1]], [[w / 2, -h / 2], [w / 2, h / 2], [1, 0]], [[w / 2, h / 2], [-w / 2, h / 2], [0, 1]], [[-w / 2, h / 2], [-w / 2, -h / 2], [-1, 0]]];
      sides.forEach(function (e) {
        var n = [e[2][0] * c - e[2][1] * s, e[2][0] * s + e[2][1] * c, 0];
        quad(Pt(e[0][0], e[0][1], 0), Pt(e[1][0], e[1][1], 0), Pt(e[1][0], e[1][1], hz), Pt(e[0][0], e[0][1], hz), n);
      });
      end(st, { color: [0.80, 0.83, 0.87], spec: 0.04 });
    }
    function ring(u) { var v = norm3([-u[1], u[0], 0]); return [v, [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]]; }
    function nAt(v, w, t) { return [v[0] * Math.cos(t) + w[0] * Math.sin(t), v[1] * Math.cos(t) + w[1] * Math.sin(t), v[2] * Math.cos(t) + w[2] * Math.sin(t)]; }
    function off(p, n, r) { return [p[0] + n[0] * r, p[1] + n[1] * r, p[2] + n[2] * r]; }

    function cyl(a, b, r, col, spec, capA, capB) {
      var u = norm3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), vw = ring(u), N = 18, st = begin();
      for (var i = 0; i < N; i++) {
        var n0 = nAt(vw[0], vw[1], i / N * Math.PI * 2), n1 = nAt(vw[0], vw[1], (i + 1) / N * Math.PI * 2);
        var nm = norm3([n0[0] + n1[0], n0[1] + n1[1], n0[2] + n1[2]]);
        quad(off(a, n0, r), off(b, n0, r), off(b, n1, r), off(a, n1, r), nm);
        if (capA) tri(a, off(a, n1, r), off(a, n0, r), [-u[0], -u[1], -u[2]]);
        if (capB) tri(b, off(b, n0, r), off(b, n1, r), u);
      }
      end(st, { color: col, spec: spec });
    }
    function cone(a, apex, r, col, spec) {
      var u = norm3([apex[0] - a[0], apex[1] - a[1], apex[2] - a[2]]), vw = ring(u), N = 18, st = begin();
      for (var i = 0; i < N; i++) {
        var n0 = nAt(vw[0], vw[1], i / N * Math.PI * 2), n1 = nAt(vw[0], vw[1], (i + 1) / N * Math.PI * 2);
        tri(off(a, n0, r), off(a, n1, r), apex, norm3([n0[0] + n1[0] + u[0] * 0.3, n0[1] + n1[1] + u[1] * 0.3, n0[2] + n1[2] + u[2] * 0.3]));
      }
      end(st, { color: col, spec: spec });
    }

    box(360, 175, 92, 134, 9, -0.26);

    var r = 4.4, p0 = [262, -170, r], p1 = [300, -36, r];
    var dir = norm3([p1[0] - p0[0], p1[1] - p0[1], 0]);
    var q = function (t) { return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, r]; };
    cyl(q(0.0), q(0.80), r, [0.12, 0.17, 0.32], 0.10, true, false);
    cyl(q(0.80), q(0.86), r * 1.04, [0.80, 0.83, 0.88], 0.35, false, false);
    cyl(q(0.86), q(1.0), r * 0.92, [0.12, 0.17, 0.32], 0.10, false, false);
    cone(q(1.0), [q(1.0)[0] + dir[0] * 13, q(1.0)[1] + dir[1] * 13, r * 0.6], r * 0.92, [0.78, 0.81, 0.86], 0.4);
    cyl([q(0.08)[0], q(0.08)[1], r * 1.9], [q(0.42)[0], q(0.42)[1], r * 1.9], 1.1, [0.80, 0.83, 0.88], 0.35, true, true);
    PROPS = items;
    return new Float32Array(V);
  }

  function eo(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return 1 - Math.pow(1 - t, 3); }
  function foldAngle(f, t) {
    var u = Math.min(1, Math.max(0, (t - f.t[0]) / (f.t[1] - f.t[0])));
    u = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    return Math.PI * u;
  }
  function rot2(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c]; }
  function flatCenter(D) { var r = D.rect; return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2]; }

  function placement(D, t, tall) {
    var S = tall ? D.tall : D.wide, rad = Math.PI / 180;
    var cf = flatCenter(D), rc = rot2([cf[0] - D.pivot[0], cf[1] - D.pivot[1]], S.r * rad);
    var o0 = [S.c[0] - (rc[0] + D.pivot[0]), S.c[1] - (rc[1] + D.pivot[1])];
    var e = M.ease(D.move[0], D.move[1], t), en = 1 - eo(D.enter.t, D.enter.t + 0.6, t);
    var lift = Math.sin(Math.PI * e);
    var phi = M.lerp(S.r, 0, e) + D.enter.r * en;
    var ox = M.lerp(o0[0], 0, e) + D.enter.d[0] * en, oy = M.lerp(o0[1], 0, e) + D.enter.d[1] * en;
    var oz = 0.25 + lift * 44 + 26 * en * en;
    var psi = (Math.sin(t * 1.7 + D.seed) * 3 * lift + 6 * en) * rad;
    return { phi: phi * rad, psi: psi, ox: ox, oy: oy, oz: oz };
  }

  var TRI = [], LN = [], RANGES = [];
  function geometry(t, tall) {
    TRI.length = 0; LN.length = 0; RANGES.length = 0;
    PAPERS.forEach(function (D) {
      var pl = placement(D, t, tall), cphi = Math.cos(pl.phi), sphi = Math.sin(pl.phi), cps = Math.cos(pl.psi), sps = Math.sin(pl.psi);
      var ang = D.folds.map(function (f) { var a = foldAngle(f, t); return [Math.cos(a), Math.sin(a), a > 0]; });
      var start = TRI.length / 9;
      function place(q) {
        var x = q[0] - D.pivot[0], y = q[1] - D.pivot[1], z = q[2];
        var x1 = x * cphi + y * sphi, y1 = -x * sphi + y * cphi;
        var y2 = y1 * cps - z * sps, z2 = y1 * sps + z * cps;
        return [x1 + D.pivot[0] + pl.ox - GLYPH_C[0], -(y2 + D.pivot[1] + pl.oy - GLYPH_C[1]), z2 + pl.oz];
      }
      function placeN(n) {
        var x1 = n[0] * cphi + n[1] * sphi, y1 = -n[0] * sphi + n[1] * cphi;
        return [x1, -(y1 * cps - n[2] * sps), y1 * sps + n[2] * cps];
      }
      D.polys.forEach(function (pg) {
        var nrm = [0, 0, 1], pts = pg.v.map(function (v) { return [v[0], v[1], 0]; });
        D.folds.forEach(function (f, k) {
          if (!pg.mv[k] || !ang[k][2]) return;
          var c = ang[k][0], s = ang[k][1];
          for (var i = 0; i < pts.length; i++) pts[i] = rotL(pts[i], f.p, f.h, f.a, c, s);
          nrm = rotL(nrm, [0, 0], 0, f.a, c, s);
        });
        var W = pts.map(place), N = placeN(nrm), UV = pg.v.map(function (v) { return D.uv(v[0], v[1]); });
        for (var i = 1; i < W.length - 1; i++) {
          [0, i, i + 1].forEach(function (j) { TRI.push(W[j][0], W[j][1], W[j][2], N[0], N[1], N[2], UV[j][0], UV[j][1], pg.tone); });
        }
        for (var e = 0; e < W.length; e++) { var a = W[e], b = W[(e + 1) % W.length]; LN.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
      });
      RANGES.push([start, TRI.length / 9 - start]);
    });
  }

  function framing(t, api) {
    var W = api.W, H = api.H, L = api.logo, mode = api.mode, tall = mode === 'stack' || (mode === 'film' && H > W);
    var sp = tall ? { c: [58, 92], w: 210, h: 380 } : { c: [96, 66], w: 380, h: 290 };
    var ppu0 = tall ? Math.min(W * 0.9 / sp.w, H * 0.6 / sp.h) : Math.min(W * 0.84 / sp.w, H * 0.8 / sp.h);
    var ppu1 = tall ? Math.min(W * 0.6, H * 0.34) / GLYPH_H : Math.min(H * 0.56, W * 0.4) / GLYPH_H;
    var ppu2 = L.s * 0.86 / GLYPH_H;
    var s0 = tall ? [W / 2, H * 0.40] : [W / 2, H * 0.5], s1 = tall ? [W / 2, H * 0.36] : [W / 2, H * 0.5], s2 = [L.x, L.y];
    var e1 = M.ease(1.15, 3.25, t), e2 = M.ease(3.5, 4.45, t);
    var c = [M.lerp(sp.c[0], GLYPH_C[0], e1), M.lerp(sp.c[1], GLYPH_C[1], e1)];
    var ppu = M.lerp(M.lerp(ppu0, ppu1, e1), ppu2, e2);
    var scr = [M.lerp(M.lerp(s0[0], s1[0], e1), s2[0], e2), M.lerp(M.lerp(s0[1], s1[1], e1), s2[1], e2)];
    return { tall: tall, c: [c[0] - GLYPH_C[0], -(c[1] - GLYPH_C[1])], ppu: ppu, scr: scr };
  }

  M.run({
    id: 'fold', theme: 'light', bg: '#F3F4F6', textAt: 4.6, revisitAt: 3.4, skipSpeed: 5,
    accent: BLUE, accentInk: '#FFFFFF', accentHi: BLUE,
    fallbackBg: 'linear-gradient(160deg, #FFFFFF 0%, #EEF3FF 60%, #E7F8F1 100%)',
    filmText: { eb: BLUE, tx: '#0B1530', hi: BLUE, sub: 'rgba(11,21,48,.66)', textAt: 4.7,
      sub2: '<span>영수증 · 카드 전표 · 납부서, 하나도 빠짐없이</span>' },
    init: function (api) {
      try {
        gl = api.canvas.getContext('webgl2', { antialias: true, alpha: false, depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: !!api.FILM, powerPreference: 'high-performance' });
      } catch (e) { gl = null; }
      if (!gl) return false;
      ANISO = gl.getExtension('EXT_texture_filter_anisotropic');
      P.paper = M.glProgram(gl, VS_PAPER, FS_PAPER);
      P.prop = M.glProgram(gl, VS_PAPER, FS_PROP);
      P.line = M.glProgram(gl, VS_LINE, FS_LINE);
      P.shadow = M.glProgram(gl, VS_SHADOW, FS_SHADOW);
      P.blur = M.glProgram(gl, M.FULL_VS, FS_BLUR);
      P.bg = M.glProgram(gl, M.FULL_VS, FS_BG);
      function vao9(buf) {
        var v = gl.createVertexArray(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 36, 24);
        gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 36, 32);
        return v;
      }
      BUF.tri = gl.createBuffer(); BUF.ln = gl.createBuffer(); BUF.prop = gl.createBuffer();
      VAO.tri = vao9(BUF.tri);
      gl.bindBuffer(gl.ARRAY_BUFFER, BUF.prop); gl.bufferData(gl.ARRAY_BUFFER, buildProps(), gl.STATIC_DRAW);
      VAO.prop = vao9(BUF.prop);
      VAO.ln = gl.createVertexArray(); gl.bindVertexArray(VAO.ln); gl.bindBuffer(gl.ARRAY_BUFFER, BUF.ln);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
      VAO.empty = gl.createVertexArray();
      gl.bindVertexArray(null);
      makeTextures();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { makeTextures(); try { window.dispatchEvent(new Event('resize')); } catch (e) {} });
      return true;
    },
    draw: function (t, dt, api) {
      var cw = api.canvas.width, ch = api.canvas.height, W = api.W, H = api.H;
      var F = framing(t, api);
      geometry(t, F.tall);

      var rad = Math.PI / 180, st = M.ease(2.85, 3.9, t);
      var tau = M.lerp(40, 30, st) * rad + api.mouse.sy * 5 * rad * st;
      var beta = M.lerp(-14, -7, M.ease(0.8, 3.9, t)) * rad + api.mouse.sx * 8 * rad * st;
      var Dd = 760, fov = 32 * rad, tgt = [F.c[0], F.c[1], 0];
      var eye = [tgt[0] + Dd * Math.sin(tau) * Math.sin(beta), tgt[1] - Dd * Math.sin(tau) * Math.cos(beta), Dd * Math.cos(tau)];
      var V = lookAt(eye, tgt, [-Math.sin(beta), Math.cos(beta), 0]);
      var Pm = persp(fov, W / H, Dd * 0.25, Dd * 4);
      var base = H / (2 * Dd * Math.tan(fov / 2)), k = F.ppu / base * (1 + 0.045 * M.ease(3.6, 5.0, t));
      var sx = F.scr[0] / W * 2 - 1, sy = 1 - F.scr[1] / H * 2;
      var Lm = [k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1, 0, sx, sy, 0, 1];
      var VP = m4mul(Lm, m4mul(Pm, V));
      var veilL = api.mode === 'side' ? M.ease(3.5, 4.45, t) : 0, veilB = api.mode === 'stack' ? M.ease(3.5, 4.45, t) : 0;

      gl.bindBuffer(gl.ARRAY_BUFFER, BUF.tri); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(TRI), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, BUF.ln); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(LN), gl.DYNAMIC_DRAW);

      ensureFB(cw, ch);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, FB[0].f); gl.viewport(0, 0, FBW, FBH);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(P.shadow.p); gl.uniformMatrix4fv(P.shadow.u.uVP, false, VP); gl.uniform2f(P.shadow.u.uSh, SH[0], SH[1]);
      gl.bindVertexArray(VAO.tri); gl.drawArrays(gl.TRIANGLES, 0, TRI.length / 9);
      gl.bindVertexArray(VAO.prop); PROPS.forEach(function (it) { gl.drawArrays(gl.TRIANGLES, it.first, it.count); });
      gl.disable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
      gl.useProgram(P.blur.p); gl.bindVertexArray(VAO.empty); gl.uniform2f(P.blur.u.uSize, FBW, FBH); gl.uniform1i(P.blur.u.uS, 0); gl.activeTexture(gl.TEXTURE0);
      var px = 1 / FBW, py = 1 / FBH, spread = Math.max(1, api.dpr * F.ppu / 2.4);
      [[1.6, 0, 0.45, 0], [0, 1.6, 0, 0.45], [3.2, 0, 0.7, 0], [0, 3.2, 0, 0.7]].forEach(function (s, i) {
        var src = FB[i % 2], dst = FB[(i + 1) % 2];
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.f); gl.bindTexture(gl.TEXTURE_2D, src.t);
        gl.uniform2f(P.blur.u.uR, s[0] * px * spread, s[1] * py * spread); gl.uniform2f(P.blur.u.uG, s[2] * px * spread, s[3] * py * spread);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });

      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cw, ch);
      gl.useProgram(P.bg.p); gl.bindVertexArray(VAO.empty);
      gl.bindTexture(gl.TEXTURE_2D, FB[0].t);
      gl.uniform2f(P.bg.u.uRes, cw, ch); gl.uniformMatrix4fv(P.bg.u.uInv, false, m4inv(VP)); gl.uniform1i(P.bg.u.uS, 0);
      gl.uniform4f(P.bg.u.uMat, MAT[0], MAT[1], MAT[2], MAT[3]); gl.uniform1f(P.bg.u.uLeft, veilL); gl.uniform1f(P.bg.u.uBottom, veilB);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(P.prop.p); gl.bindVertexArray(VAO.prop);
      gl.uniformMatrix4fv(P.prop.u.uVP, false, VP); gl.uniform3f(P.prop.u.uEye, eye[0], eye[1], eye[2]);
      gl.uniform3f(P.prop.u.uL, LIGHT[0], LIGHT[1], LIGHT[2]); gl.uniform1i(P.prop.u.uTex, 0); gl.uniform2f(P.prop.u.uRes, cw, ch);
      gl.uniform1f(P.prop.u.uLeft, veilL); gl.uniform1f(P.prop.u.uBottom, veilB);
      gl.bindTexture(gl.TEXTURE_2D, CALC_TEX);
      PROPS.forEach(function (it) {
        gl.uniform1f(P.prop.u.uUseTex, it.tex ? 1 : 0); gl.uniform1f(P.prop.u.uSpec, it.spec || 0);
        var c = it.color || [1, 1, 1]; gl.uniform3f(P.prop.u.uColor, c[0], c[1], c[2]);
        gl.drawArrays(gl.TRIANGLES, it.first, it.count);
      });

      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
      gl.useProgram(P.paper.p); gl.bindVertexArray(VAO.tri);
      gl.uniformMatrix4fv(P.paper.u.uVP, false, VP); gl.uniform3f(P.paper.u.uEye, eye[0], eye[1], eye[2]);
      gl.uniform3f(P.paper.u.uL, LIGHT[0], LIGHT[1], LIGHT[2]); gl.uniform1i(P.paper.u.uTex, 0);
      var sw = M.sstep(3.55, 4.4, t);
      gl.uniform1f(P.paper.u.uSheen, sw > 0 && sw < 1 ? 1 : 0); gl.uniform1f(P.paper.u.uSweep, M.lerp(-160, 220, sw));
      gl.uniform1f(P.paper.u.uWash, M.lerp(-260, 260, M.ease(3.05, 3.85, t))); gl.uniform1f(P.paper.u.uWashAmt, WASH);
      PAPERS.forEach(function (D, i) {
        gl.bindTexture(gl.TEXTURE_2D, D.tex); gl.uniform3f(P.paper.u.uBack, D.back[0], D.back[1], D.back[2]);
        gl.drawArrays(gl.TRIANGLES, RANGES[i][0], RANGES[i][1]);
      });
      gl.disable(gl.POLYGON_OFFSET_FILL);

      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.useProgram(P.line.p); gl.bindVertexArray(VAO.ln); gl.uniformMatrix4fv(P.line.u.uVP, false, VP); gl.uniform4f(P.line.u.uC, 0.10, 0.14, 0.30, 0.13 * (1.0 - 0.85 * M.ease(3.05, 3.85, t)));
      gl.drawArrays(gl.LINES, 0, LN.length / 3);
      gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
      gl.bindVertexArray(null);
    },
    finish: function () { if (gl) gl.finish(); }
  });
})();
