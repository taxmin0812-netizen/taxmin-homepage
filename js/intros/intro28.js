(function () {
  'use strict';
  var M = window.MinIntro;
  var gl, P = {}, VAO = {}, BUF = {}, FB = null, FBW = 0, FBH = 0, ATLAS = null, COVER_TEX = null, ANISO = null;
  var N = 46, TH = 0.72;
  var SW = 74, SHH = 102;
  var CW = 78, CH = 106, CT = 2.6;
  var BLUE = '#2554F0', NAVY = '#0E2139', CHECK = '#3F7BFF', INK = '#283044', MUTE = '#7A8397', RED = '#D9534F';
  var LIGHT = norm3([-0.35, 0.45, 1.0]);
  var SHD = [0.34, -0.44];
  var AT = 2048;

  function norm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function eo(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return 1 - Math.pow(1 - t, 3); }
  function eio(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var TYPES = [
    { name: 'invoice', w: 70, h: 99, at: [0, 0, 490, 693], back: [0.975, 0.978, 0.985] },
    { name: 'payslip', w: 70, h: 99, at: [500, 0, 490, 693], back: [0.975, 0.978, 0.985] },
    { name: 'bank', w: 70, h: 99, at: [1000, 0, 490, 693], back: [0.975, 0.978, 0.985] },
    { name: 'receipt', w: 36, h: 100, at: [1500, 0, 252, 700], back: [0.965, 0.97, 0.978] },
    { name: 'card', w: 50, h: 80, at: [0, 710, 350, 560], back: [0.955, 0.962, 0.975] },
    { name: 'slip', w: 100, h: 62, at: [360, 710, 700, 434], back: [0.925, 0.945, 0.99] }
  ];
  var TYPE_MIX = [0, 0, 1, 2, 3, 3, 4, 4, 5, 0, 2, 3];

  var SHEETS = [];
  (function () {
    var R = M.rng(2610), order = [];
    for (var i = 0; i < N; i++) order.push(i);
    for (i = N - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
    for (i = 0; i < N; i++) {
      var r0 = 30 + Math.pow(R(), 0.8) * 92;
      SHEETS.push({
        type: TYPE_MIX[Math.floor(R() * TYPE_MIX.length)],
        r0: r0, th0: R() * Math.PI * 2, w: 1.5 + R() * 0.9 + (125 - r0) / 125 * 0.9,
        z0: 4 + R() * 74, zw: 0.6 + R() * 1.4, zp: R() * 6.28,
        pitch: 0.9 + R() * 0.9, tumble: R() * 6.28, tw: 1.2 + R() * 2.2, spin: R() * 6.28,
        fa: R() * 6.28, fb: R() * 6.28, delay: R() * 0.25,
        k: order[i], jx: (R() - 0.5) * 2.2, jy: (R() - 0.5) * 2.2, jyaw: (R() - 0.5) * 0.06
      });
    }
  })();
  var LAND0 = 1.18, LAND_SPAN = 1.15, LAND_D = 0.42;
  var COVER = [2.66, 3.06];

  function m4mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; }
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
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; det = det ? 1 / det : 0;
    return new Float32Array([
      (a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det,
      (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det,
      (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det,
      (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det]);
  }

  function model(yaw, a, b, px, py, pz) {
    var cz = Math.cos(yaw), sz = Math.sin(yaw), cx = Math.cos(a), sx = Math.sin(a), cy = Math.cos(b), sy = Math.sin(b);

    var r00 = cz * cy - sz * sx * sy, r01 = -sz * cx, r02 = cz * sy + sz * sx * cy;
    var r10 = sz * cy + cz * sx * sy, r11 = cz * cx, r12 = sz * sy - cz * sx * cy;
    var r20 = -cx * sy, r21 = sx, r22 = cx * cy;
    return [r00, r10, r20, 0, r01, r11, r21, 0, r02, r12, r22, 0, px, py, pz, 1];
  }

  function writer(x) {
    return function (s, X, Y, size, wt, col, al) { x.font = (wt || 600) + ' ' + size + 'px ' + M.FONT; x.fillStyle = col || INK; x.textAlign = al || 'left'; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y); };
  }
  function dash(x, x0, x1, y, col) { x.save(); x.strokeStyle = col || '#BAC1CF'; x.setLineDash([7, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke(); x.restore(); }
  function line(x, x0, y0, x1, y1, col, w) { x.strokeStyle = col; x.lineWidth = w || 1.5; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); }
  function barcode(x, X, Y, w, h, seed, col) { var rnd = M.rng(seed), cx = X; x.fillStyle = col || INK; while (cx < X + w) { var bw = 2 + Math.floor(rnd() * 3) * 2; if (rnd() > 0.38) x.fillRect(cx, Y, bw, h); cx += bw + 2 + Math.floor(rnd() * 2) * 2; } }
  function grain(x, X, Y, w, h, seed, a) { var rnd = M.rng(seed); x.save(); x.globalAlpha = a; for (var i = 0; i < w * h / 110; i++) { x.fillStyle = rnd() > 0.5 ? '#E8ECF2' : '#FFFFFF'; x.fillRect(X + rnd() * w, Y + rnd() * h, 1 + rnd() * 2, 1); } x.restore(); }
  function paperBg(x, r, col, seed) { x.fillStyle = col || '#FFFFFF'; x.fillRect(r[0], r[1], r[2], r[3]); grain(x, r[0], r[1], r[2], r[3], seed, 0.7); }

  function drawAtlas() {
    var c = document.createElement('canvas'); c.width = AT; c.height = AT; var x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, AT, AT);
    var T = writer(x), r, L, R, y;

    r = TYPES[0].at; paperBg(x, r, '#FFFFFF', 11); x.save(); x.translate(r[0], r[1]); L = 26; R = r[2] - 26;
    x.strokeStyle = '#2F5BD8'; x.lineWidth = 3; x.strokeRect(14, 14, r[2] - 28, r[3] - 28);
    T('전 자 세 금 계 산 서', r[2] / 2, 66, 30, 800, '#2F5BD8', 'center'); T('(공급받는자 보관용)', r[2] / 2, 92, 14, 600, MUTE, 'center');
    line(x, 14, 110, r[2] - 14, 110, '#2F5BD8', 2);
    [['공급자', 120], ['공급받는자', 250]].forEach(function (b, i) {
      var top = 118 + i * 0; var bx = i === 0 ? 22 : r[2] / 2 + 6, bw = r[2] / 2 - 28;
      x.strokeStyle = '#9DB3F2'; x.lineWidth = 1.5; x.strokeRect(bx, 122, bw, 150);
      T(b[0], bx + 10, 146, 15, 800, '#2F5BD8');
      [['등록번호', '***-**-*****'], ['상호', i ? '○○상사' : '○○유통'], ['성명', i ? '홍*동' : '김*수'], ['업태', i ? '도소매' : '제조']].forEach(function (q, k) { T(q[0], bx + 10, 176 + k * 26, 13, 600, MUTE); T(q[1], bx + bw - 10, 176 + k * 26, 13, 700, INK, 'right'); });
    });
    y = 300; x.fillStyle = '#EEF2FD'; x.fillRect(22, y, r[2] - 44, 30);
    ['월 일', '품목', '수량', '공급가액', '세액'].forEach(function (h, k) { T(h, [44, 140, 270, 360, 440][k], y + 21, 13, 800, '#2F5BD8', 'center'); });
    y += 30;
    [['10 02', '원단 납품', '40', '2,400,000', '240,000'], ['10 09', '부자재', '120', '860,000', '86,000'], ['10 15', '운송비', '1', '150,000', '15,000'], ['10 21', '포장재', '300', '420,000', '42,000']].forEach(function (q) {
      line(x, 22, y + 34, r[2] - 22, y + 34, '#D5DEF6', 1);
      T(q[0], 44, y + 23, 13, 600, INK, 'center'); T(q[1], 140, y + 23, 13, 600, INK, 'center'); T(q[2], 270, y + 23, 13, 600, INK, 'center'); T(q[3], 360, y + 23, 13, 700, INK, 'center'); T(q[4], 440, y + 23, 13, 700, INK, 'center'); y += 34;
    });
    y += 30; x.fillStyle = '#F4F7FE'; x.fillRect(22, y, r[2] - 44, 70);
    T('합계 금액', 40, y + 30, 15, 800, '#2F5BD8'); T('4,213,000', r[2] - 40, y + 50, 34, 800, INK, 'right');
    y += 110; T('위 금액을 청구 함', r[2] / 2, y, 15, 700, MUTE, 'center');
    x.save(); x.strokeStyle = 'rgba(217,83,79,.6)'; x.lineWidth = 3; x.beginPath(); x.arc(r[2] - 80, y + 70, 34, 0, 7); x.stroke(); x.restore();
    T('승인', r[2] - 80, y + 76, 16, 800, 'rgba(217,83,79,.75)', 'center');
    barcode(x, 40, y + 46, 220, 40, 31);
    x.restore();

    r = TYPES[1].at; paperBg(x, r, '#FFFFFF', 12); x.save(); x.translate(r[0], r[1]); L = 30; R = r[2] - 30;
    x.fillStyle = '#1F2A44'; x.fillRect(0, 0, r[2], 10);
    T('급 여 명 세 서', r[2] / 2, 70, 30, 800, INK, 'center'); T('2026년 10월분', r[2] / 2, 98, 15, 700, MUTE, 'center');
    y = 130; [['성명', '이*은'], ['부서', '관리팀'], ['지급일', '2026.10.25']].forEach(function (q) { T(q[0], L, y, 14, 600, MUTE); T(q[1], R, y, 14, 700, INK, 'right'); y += 26; });
    y += 10; x.fillStyle = '#EEF1F6'; x.fillRect(L - 8, y, R - L + 16, 30); T('지급 항목', L, y + 21, 14, 800, INK); T('금액', R, y + 21, 14, 800, INK, 'right'); y += 52;
    [['기본급', '2,800,000'], ['식대', '200,000'], ['연장근로수당', '184,000']].forEach(function (q) { T(q[0], L, y, 15, 600, INK); T(q[1], R, y, 15, 700, INK, 'right'); y += 30; });
    y += 4; x.fillStyle = '#EEF1F6'; x.fillRect(L - 8, y, R - L + 16, 30); T('공제 항목', L, y + 21, 14, 800, INK); y += 52;
    [['국민연금', '126,000'], ['건강보험', '99,260'], ['고용보험', '25,200'], ['소득세', '84,850'], ['지방소득세', '8,480']].forEach(function (q) { T(q[0], L, y, 15, 600, INK); T(q[1], R, y, 15, 700, INK, 'right'); y += 30; });
    y += 14; line(x, L - 8, y, R + 8, y, INK, 2); y += 40; T('실 지급액', L, y, 18, 800, INK); T('2,840,210', R, y + 2, 30, 800, BLUE, 'right');
    x.restore();

    r = TYPES[2].at; paperBg(x, r, '#FFFFFF', 13); x.save(); x.translate(r[0], r[1]); L = 24; R = r[2] - 24;
    T('거래내역 조회', L, 62, 26, 800, INK); T('기업 자유예금 ***-******-**-012', L, 90, 13, 600, MUTE);
    x.fillStyle = '#E9F0FF'; x.fillRect(14, 112, r[2] - 28, 30);
    ['거래일', '적요', '출금', '입금', '잔액'].forEach(function (h, k) { T(h, [40, 120, 230, 320, 420][k], 133, 13, 800, '#3653C9', 'center'); });
    y = 142; var bal = 18450000, R2 = M.rng(77);
    for (var i = 0; i < 13; i++) {
      var out = R2() > 0.45, amt = Math.round((R2() * 1800 + 60)) * 1000; bal += out ? -amt : amt;
      line(x, 14, y + 34, r[2] - 14, y + 34, '#E3E8F2', 1);
      T('10.' + String(2 + i * 2).padStart(2, '0'), 40, y + 23, 12, 600, INK, 'center');
      T(out ? ['카드대금', '임대료', '급여', '부가세', '전기요금'][i % 5] : ['매출입금', '이체입금', '카드매출'][i % 3], 120, y + 23, 12, 600, INK, 'center');
      T(out ? amt.toLocaleString() : '', 230, y + 23, 12, 700, RED, 'center'); T(out ? '' : amt.toLocaleString(), 320, y + 23, 12, 700, BLUE, 'center');
      T(bal.toLocaleString(), 420, y + 23, 12, 600, INK, 'center'); y += 34;
    }
    x.restore();

    r = TYPES[3].at; paperBg(x, r, '#FFFFFF', 14); x.save(); x.translate(r[0], r[1]); L = 22; R = r[2] - 22; y = 70;
    T('영 수 증', r[2] / 2, y, 30, 800, INK, 'center'); y += 24; T('R E C E I P T', r[2] / 2, y, 11, 700, MUTE, 'center'); y += 20; dash(x, 16, r[2] - 16, y); y += 32;
    [['상호', '○○문구'], ['일시', '10-17 14:32'], ['번호', '0042']].forEach(function (q) { T(q[0], L, y, 13, 600, MUTE); T(q[1], R, y, 13, 600, INK, 'right'); y += 26; });
    dash(x, 16, r[2] - 16, y - 4); y += 28;
    [['A4 용지', '24,500'], ['볼펜 세트', '7,800'], ['바인더', '8,700'], ['택배', '4,000'], ['원두', '18,000']].forEach(function (q) { T(q[0], L, y, 14, 600, INK); T(q[1], R, y, 14, 700, INK, 'right'); y += 30; });
    dash(x, 16, r[2] - 16, y - 6); y += 30; T('부가세', L, y, 13, 600, MUTE); T('5,727', R, y, 13, 600, INK, 'right'); y += 40;
    T('합계', L, y, 17, 800, INK); T('63,000', R, y, 30, 800, INK, 'right'); y += 26; dash(x, 16, r[2] - 16, y); y += 40;
    barcode(x, 30, y, r[2] - 60, 54, 7); y += 84; T('감사합니다', r[2] / 2, y, 16, 800, INK, 'center');
    x.restore();

    r = TYPES[4].at; paperBg(x, r, '#FFFFFF', 15); x.save(); x.translate(r[0], r[1]); L = 22; R = r[2] - 22; y = 62;
    x.fillStyle = BLUE; x.fillRect(0, 0, r[2], 12);
    T('카드 매출전표', r[2] / 2, y, 26, 800, INK, 'center'); y += 22; T('(고객용)', r[2] / 2, y, 12, 600, MUTE, 'center'); y += 18; dash(x, 16, r[2] - 16, y); y += 32;
    [['카드번호', '****-1234'], ['거래일시', '10/17 09:12'], ['승인번호', '3018****']].forEach(function (q) { T(q[0], L, y, 13, 600, MUTE); T(q[1], R, y, 13, 600, INK, 'right'); y += 26; });
    dash(x, 16, r[2] - 16, y - 4); y += 30;
    [['판매금액', '30,000'], ['부가세', '3,000']].forEach(function (q) { T(q[0], L, y, 14, 600, MUTE); T(q[1], R, y, 14, 700, INK, 'right'); y += 28; });
    y += 14; T('합계', L, y, 17, 800, INK); T('33,000', R, y, 30, 800, BLUE, 'right'); y += 26; dash(x, 16, r[2] - 16, y); y += 50;
    T('서명', L, y, 13, 700, MUTE); x.strokeStyle = INK; x.lineWidth = 2.5; x.lineCap = 'round'; x.beginPath(); x.moveTo(90, y + 4);
    x.bezierCurveTo(116, y - 30, 140, y + 22, 166, y - 6); x.bezierCurveTo(186, y - 22, 200, y + 12, 236, y - 4); x.stroke();
    y += 40; barcode(x, 40, y, r[2] - 80, 40, 23);
    x.restore();

    r = TYPES[5].at; x.save(); x.translate(r[0], r[1]); x.fillStyle = '#F6F9FF'; x.fillRect(0, 0, r[2], r[3]); grain(x, 0, 0, r[2], r[3], 16, 0.5);
    x.strokeStyle = BLUE; x.lineWidth = 3; x.strokeRect(12, 12, r[2] - 24, r[3] - 24); x.fillStyle = BLUE; x.fillRect(12, 12, r[2] - 24, 54);
    T('국세 납부서', 30, 50, 26, 800, '#FFFFFF'); T('납세자 보관용', r[2] - 30, 48, 14, 700, 'rgba(255,255,255,.85)', 'right');
    var rows = [['세목', '부가가치세'], ['과세기간', '2026년 2기 예정'], ['납부기한', '2026. 10. 27.'], ['납세자', '○○상사']], top = 66, rh = 40;
    x.fillStyle = '#E6EDFF'; x.fillRect(12, top, 110, rh * rows.length);
    rows.forEach(function (q, k) { var yy = top + k * rh; line(x, 12, yy + rh, 420, yy + rh, '#A9BEF9', 1.5); T(q[0], 26, yy + 26, 14, 700, '#3653C9'); T(q[1], 134, yy + 26, 15, 700, INK); });
    x.strokeStyle = BLUE; x.lineWidth = 3; x.strokeRect(440, 82, 236, 130); T('납부할 세액', 456, 114, 16, 700, '#3653C9'); T('1,284,000', 646, 182, 38, 800, BLUE, 'right'); T('원', 664, 182, 15, 700, BLUE, 'right');
    barcode(x, 440, 232, 236, 52, 41, '#1C2A55'); T('0126 1017 2554 0012 8400', 26, 268, 16, 700, '#3C4864');
    x.restore();
    return c;
  }

  var MIN_MARK = { w: 478, h: 478, d: 'M10 0 469 0 478 9 478 379 477 380 458 380 457 379 457 21 395 21 394 22 394 380 374 380 374 22 373 21 21 21 21 456 22 457 457 457 457 418 458 417 477 417 478 418 478 468 474 472 467 478 11 478 1 469 0 467 0 10ZM109 98 309 98 318 107 319 109 319 306 310 316 308 316 308 317 110 317 100 307 100 107ZM121 119 121 296 297 296 297 295 298 295 298 119ZM165 153 289 153 289 174 176 174 176 287 155 287 155 163 159 160ZM155 325 175 325 176 326 176 388 477 388 478 389 478 409 165 409 162 406 155 399Z' };
  var MIN_WM = { w: 923, h: 202, a: 'M132 13 153 13 153 183 132 183 132 182 131 182 131 14ZM426 13 428 13 428 15 430 17 430 20 431 20 431 22 433 24 433 27 434 27 431 30 429 30 429 31 426 31 426 32 423 32 423 33 413 34 413 35 381 35 381 17 413 17 413 16 423 15 423 14 426 14ZM475 13 497 13 497 183 475 183 475 141 471 145 466 147 465 149 460 150 458 152 449 153 449 154 349 154 349 135 397 135 397 123 382 119 379 116 377 116 376 114 374 114 369 109 369 107 367 106 366 101 365 101 365 89 366 89 366 86 369 83 369 81 373 77 375 77 377 74 379 74 379 73 381 73 385 70 391 69 391 68 403 67 403 66 420 67 420 68 425 68 425 69 428 69 428 70 431 70 431 71 435 72 436 74 438 74 439 76 441 76 445 80 445 82 447 83 447 85 449 87 449 91 450 91 450 99 449 99 449 103 448 103 447 107 439 115 437 115 436 117 434 117 430 120 427 120 427 121 418 122 418 124 417 124 417 135 448 135 448 134 453 134 453 133 462 131 465 128 467 128 468 126 470 126 471 124 473 124 475 122ZM653 13 675 13 675 182 674 182 674 183 653 183ZM98 14 118 14 119 15 119 179 97 179 97 77 75 77 75 57 97 57 97 15ZM620 14 640 14 641 15 641 178 640 179 619 179 619 92 601 92 601 141 579 141 579 41 526 41 526 22 585 22 590 27 600 36 600 39 619 39 619 15ZM196 16 313 16 314 17 314 92 211 92 204 86 196 77ZM34 18 56 18 56 59 57 59 57 68 58 68 60 83 61 83 61 86 62 86 62 89 63 89 63 92 64 92 65 96 67 97 68 101 73 106 73 108 77 111 77 113 82 118 84 118 88 123 91 124 91 126 77 140 75 140 56 122 56 120 53 118 53 116 51 115 51 113 49 112 49 110 46 106 46 104 44 103 42 110 40 111 39 115 37 116 37 118 35 119 35 121 33 122 31 127 27 130 27 132 14 145 12 145 10 142 8 142 7 140 5 140 4 138 2 138 0 136 0 127 11 117 11 115 17 109 17 107 19 106 21 100 23 99 23 97 25 95 25 92 26 92 26 90 28 88 28 85 29 85 29 82 30 82 30 78 31 78 31 74 32 74 32 68 33 68 33 55 34 55ZM217 35 217 73 218 74 292 74 292 35ZM356 43 456 43 457 44 457 61 356 61ZM601 58 601 73 619 73 619 58ZM400 84 400 85 396 85 396 86 394 86 394 87 392 87 388 90 388 92 387 92 388 100 391 101 394 104 397 104 397 105 413 106 413 105 421 104 421 103 423 103 427 100 427 98 428 98 427 90 424 87 416 85 416 84ZM175 109 335 109 336 110 336 128 268 128 268 129 267 129 267 185 246 185 246 128 175 128Z', b: 'M893 0 919 0 920 1 920 144 919 145 893 145ZM760 9 861 9 861 106 860 107 781 107 781 106 777 106 776 104 774 104 769 97 760 89 760 85 759 85 759 10ZM785 32 785 83 786 84 834 84 835 83 835 32ZM780 127 806 127 806 179 922 179 923 180 923 202 799 202 799 201 795 200 790 195 782 187 782 185 780 183Z' };
  function drawCover() {
    var w = CW * 10, h = CH * 10, c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#16305A'); g.addColorStop(0.55, NAVY); g.addColorStop(1, '#0A1930');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    var R = M.rng(5); x.save(); x.globalAlpha = 0.07;
    for (var i = 0; i < 2600; i++) { x.fillStyle = R() > 0.5 ? '#FFFFFF' : '#000000'; x.fillRect(R() * w, R() * h, 1 + R() * 3, 1); }
    for (i = 0; i < h; i += 3) { x.fillStyle = 'rgba(255,255,255,' + (0.012 + 0.012 * R()) + ')'; x.fillRect(0, i, w, 1); }
    x.restore();
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 3; x.strokeRect(34, 34, w - 68, h - 68);

    var mk = new Path2D(MIN_MARK.d), wa = new Path2D(MIN_WM.a), wb = new Path2D(MIN_WM.b);
    var ms = 300 / MIN_MARK.w, mx = w / 2 - 150, my = h * 0.40 - 150;
    var ts = 500 / MIN_WM.w, tx = w / 2 - 250, ty = h * 0.70 - MIN_WM.h * ts / 2;
    function logo(dx, dy, ca, cb) {
      x.save(); x.translate(mx + dx, my + dy); x.scale(ms, ms); x.fillStyle = ca; x.fill(mk, 'evenodd'); x.restore();
      x.save(); x.translate(tx + dx, ty + dy); x.scale(ts, ts); x.fillStyle = ca; x.fill(wa, 'evenodd'); x.fillStyle = cb; x.fill(wb, 'evenodd'); x.restore();
    }
    logo(0, 6, 'rgba(0,0,0,.35)', 'rgba(0,0,0,.35)');
    logo(0, -2, 'rgba(255,255,255,.25)', 'rgba(255,255,255,.2)');
    logo(0, 0, '#FFFFFF', '#9DB8FF');
    return c;
  }
  function texFrom(cv) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (ANISO) gl.texParameterf(gl.TEXTURE_2D, ANISO.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ANISO.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  }
  function makeTextures() {
    if (ATLAS) gl.deleteTexture(ATLAS); if (COVER_TEX) gl.deleteTexture(COVER_TEX);
    ATLAS = texFrom(drawAtlas()); COVER_TEX = texFrom(drawCover());
  }

  var VS_SHEET = '#version 300 es\nlayout(location=0) in vec2 aG;layout(location=1) in vec4 aM0;layout(location=2) in vec4 aM1;layout(location=3) in vec4 aM2;layout(location=4) in vec4 aM3;' +
    'layout(location=5) in vec4 aUV;layout(location=6) in vec4 aB;layout(location=7) in vec3 aBk;uniform mat4 uVP;uniform float uShadow;uniform vec2 uSh;' +
    'out vec3 vP;out vec3 vN;out vec2 vT;out vec3 vBk;out float vZ;' +
    'void main(){float xx=aG.x-0.5,yy=aG.y-0.5;float ph=6.2831*(0.8*yy+0.3*xx);float s=aB.y*0.18;' +
    'float z=s*(aB.z*(4.0*yy*yy-0.333)+aB.w*sin(ph));float dzy=s*(aB.z*8.0*yy+aB.w*cos(ph)*6.2831*0.8)/aB.y;float dzx=s*(aB.w*cos(ph)*6.2831*0.3)/aB.x;' +
    'mat4 Mm=mat4(aM0,aM1,aM2,aM3);vec4 w=Mm*vec4(xx*aB.x,yy*aB.y,z,1.0);vN=normalize(mat3(Mm)*normalize(vec3(-dzx,-dzy,1.0)));vP=w.xyz;' +
    'vT=vec2(aUV.x+aG.x*aUV.z,aUV.y+(1.0-aG.y)*aUV.w);vBk=aBk;vZ=w.z;' +
    'if(uShadow>0.5){gl_Position=uVP*vec4(w.xy+uSh*max(w.z,0.0),0.0,1.0);}else{gl_Position=uVP*w;}}';
  var LIT = 'float df=dot(N,uL);float wr=max((df+0.35)/1.35,0.0);vec3 amb=mix(vec3(0.86,0.865,0.88),vec3(0.94,0.955,1.0),N.z*0.5+0.5);' +
    'vec3 H=normalize(uL+V);float sp=pow(max(dot(N,H),0.0),40.0);float fres=pow(1.0-max(dot(N,V),0.0),4.0);';
  var FS_SHEET = '#version 300 es\nprecision highp float;in vec3 vP;in vec3 vN;in vec2 vT;in vec3 vBk;in float vZ;uniform sampler2D uTex;uniform vec3 uEye;uniform vec3 uL;uniform vec2 uRes;uniform float uLeft;uniform float uBottom;out vec4 o;' +
    'void main(){vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);bool fr=dot(N,V)>0.0;if(!fr)N=-N;' +
    'vec3 tx=texture(uTex,vT).rgb;float ink=1.0-dot(tx,vec3(0.299,0.587,0.114));vec3 base=fr?tx:vBk*(1.0-0.05*ink);' + LIT +
    'vec3 c=base*(amb*0.72+vec3(0.33)*wr)+vec3(sp*0.07)+vec3(0.05)*fres;' +
    'vec2 uv=gl_FragCoord.xy/uRes;c=mix(c,vec3(0.968,0.974,0.988),uLeft*(1.0-smoothstep(0.26,0.58,uv.x))*0.9);c=mix(c,vec3(0.968,0.974,0.988),uBottom*(1.0-smoothstep(0.30,0.62,uv.y))*0.9);' +
    'o=vec4(min(c,vec3(1.0)),1.0);}';
  var FS_SHADOW = '#version 300 es\nprecision mediump float;in vec3 vP;in vec3 vN;in vec2 vT;in vec3 vBk;in float vZ;out vec4 o;void main(){o=vec4(clamp(1.0-vZ/240.0,0.22,1.0),clamp(1.0-vZ/9.0,0.0,1.0),0.0,1.0);}';

  var VS_BOX = '#version 300 es\nlayout(location=0) in vec3 aP;layout(location=1) in vec3 aN;uniform mat4 uVP;uniform mat4 uM;uniform vec3 uS;uniform float uShadow;uniform vec2 uSh;out vec3 vP;out vec3 vN;out vec3 vL;out float vZ;' +
    'void main(){vec3 l=aP*uS;vec4 w=uM*vec4(l,1.0);vP=w.xyz;vN=mat3(uM)*aN;vL=l;vZ=w.z;if(uShadow>0.5){gl_Position=uVP*vec4(w.xy+uSh*max(w.z,0.0),0.0,1.0);}else{gl_Position=uVP*w;}}';
  var FS_BOX = '#version 300 es\nprecision highp float;in vec3 vP;in vec3 vN;in vec3 vL;in float vZ;uniform sampler2D uTex;uniform vec3 uEye;uniform vec3 uL;uniform vec3 uS;uniform float uKind;uniform float uSweep;uniform vec2 uRes;uniform float uLeft;uniform float uBottom;uniform float uTh;out vec4 o;' +
    'float hs(float p){return fract(sin(p*127.1)*43758.5453);}' +
    'void main(){vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);vec3 base;' +
    'if(uKind<0.5){float k=floor((vL.z+uS.z*0.5)/uTh);float e=fract((vL.z+uS.z*0.5)/uTh);float tone=0.955+0.03*hs(k)-0.05*smoothstep(0.75,1.0,e);base=vec3(tone,tone+0.004,tone+0.012);' +
    'base*=0.93+0.07*smoothstep(-uS.z*0.5,uS.z*0.5-2.0,vL.z);}' +
    'else{vec3 nl=normalize(vN);if(abs(nl.z)>0.8&&vL.z>0.0){vec2 uv=vec2(vL.x/uS.x+0.5,0.5-vL.y/uS.y);base=texture(uTex,uv).rgb;' +
    'float sw=exp(-pow((vL.x*0.7+vL.y*0.45-uSweep)/14.0,2.0));base+=vec3(0.10,0.12,0.16)*sw;}else{base=vec3(0.07,0.13,0.24);}}' + LIT +
    'vec3 c=base*(amb*0.60+vec3(0.43)*wr)+vec3(sp*(uKind>0.5?0.16:0.05))+vec3(0.05)*fres;' +
    'vec2 uv2=gl_FragCoord.xy/uRes;c=mix(c,vec3(0.968,0.974,0.988),uLeft*(1.0-smoothstep(0.26,0.58,uv2.x))*0.9);c=mix(c,vec3(0.968,0.974,0.988),uBottom*(1.0-smoothstep(0.30,0.62,uv2.y))*0.9);' +
    'o=vec4(min(c,vec3(1.0)),1.0);}';
  var FS_BOXSH = '#version 300 es\nprecision mediump float;in vec3 vP;in vec3 vN;in vec3 vL;in float vZ;out vec4 o;void main(){o=vec4(clamp(1.0-vZ/240.0,0.22,1.0),clamp(1.0-vZ/9.0,0.0,1.0),0.0,1.0);}';
  var FS_BLUR = '#version 300 es\nprecision highp float;uniform sampler2D uS;uniform vec2 uR;uniform vec2 uG;uniform vec2 uSize;out vec4 o;' +
    'void main(){vec2 uv=gl_FragCoord.xy/uSize;float w[5]=float[](0.227027,0.1945946,0.1216216,0.054054,0.016216);' +
    'float r=texture(uS,uv).r*w[0];float g=texture(uS,uv).g*w[0];' +
    'for(int i=1;i<5;i++){float f=float(i);r+=(texture(uS,uv+uR*f).r+texture(uS,uv-uR*f).r)*w[i];g+=(texture(uS,uv+uG*f).g+texture(uS,uv-uG*f).g)*w[i];}' +
    'o=vec4(r,g,0.0,1.0);}';

  var FS_FLOOR = '#version 300 es\nprecision highp float;uniform vec2 uRes;uniform mat4 uInv;uniform sampler2D uS;uniform float uLeft;uniform float uBottom;uniform vec3 uEye;uniform vec2 uKey;out vec4 o;' +
    'float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float ns(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),u.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),u.x),u.y);}' +
    'void main(){vec2 uv=gl_FragCoord.xy/uRes;vec2 nd=uv*2.0-1.0;vec4 a=uInv*vec4(nd,-1.0,1.0);vec4 b=uInv*vec4(nd,1.0,1.0);a/=a.w;b/=b.w;' +
    'vec3 rd=b.xyz-a.xyz;float tt=-a.z/rd.z;vec3 P=a.xyz+rd*tt;bool hit=rd.z<0.0&&tt>0.0;vec2 hp=P.xy;' +
    'float k=exp(-dot(hp-uKey,hp-uKey)/(2.0*300.0*300.0));vec3 c=mix(vec3(0.925,0.938,0.965),vec3(0.988,0.991,0.997),k);c*=0.997+0.006*ns(hp*0.02);' +
    'float dist=hit?length(P-uEye):1e5;c=mix(c,vec3(0.952,0.962,0.984),smoothstep(700.0,1700.0,dist));' +
    'vec2 s=texture(uS,uv).rg;float sh=clamp(s.r*0.42+s.g*0.62,0.0,0.92);c*=vec3(1.0)-sh*vec3(0.32,0.27,0.17);' +
    'c=mix(c,vec3(0.968,0.974,0.988),uLeft*(1.0-smoothstep(0.22,0.56,uv.x))*0.88);c=mix(c,vec3(0.968,0.974,0.988),uBottom*(1.0-smoothstep(0.30,0.62,uv.y))*0.9);' +
    'c+=(hs(gl_FragCoord.xy*0.731)-0.5)*0.008;o=vec4(c,1.0);}';

  function target(w, h) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t: t, f: f };
  }
  function ensureFB(cw, ch) {
    var w = Math.max(1, Math.ceil(cw / 4)), h = Math.max(1, Math.ceil(ch / 4));
    if (FB && FBW === w && FBH === h) return;
    if (FB) FB.forEach(function (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); });
    FB = [target(w, h), target(w, h)]; FBW = w; FBH = h; gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  var INST = new Float32Array(N * 27);
  function stackTop(t) {
    var h = 0;
    for (var i = 0; i < N; i++) { var e = LAND0 + SHEETS[i].k / N * LAND_SPAN + LAND_D; h += TH * M.sstep(e - 0.06, e, t); }
    return h;
  }
  function vortex(S, t) {
    var tt = Math.max(0, t - S.delay * 0.4), tight = 1 - 0.38 * M.ease(1.1, 2.6, t);
    var inn = eo(0, 0.95, t + S.delay * 0.3);
    var zz = S.z0;
    var r = S.r0 * (0.55 + 0.6 * zz / 78) * tight * M.lerp(1.55, 1, inn);
    var th = S.th0 + S.w * tt * (1 + 0.5 * (1 - S.r0 / 126));
    var z = M.lerp(S.z0 + 34, S.z0, inn) + 6 * Math.sin(tt * S.zw + S.zp);
    var yaw = th + Math.PI / 2 + 0.6 * Math.sin(tt * 0.9 + S.spin);
    var a = S.pitch + 0.45 * Math.sin(tt * S.tw + S.tumble), b = 0.7 * Math.sin(tt * S.tw * 0.7 + S.tumble * 1.3);
    return { x: r * Math.cos(th), y: r * Math.sin(th), z: z, yaw: yaw, a: a, b: b, A: 0.55 * Math.sin(tt * 5.1 + S.fa), B: 0.32 * Math.sin(tt * 7.3 + S.fb) };
  }
  function bez(p0, p1, p2, p3, u) { var v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; }
  function sheetPose(S, t) {
    var s0 = LAND0 + S.k / N * LAND_SPAN, u = clamp((t - s0) / LAND_D, 0, 1);
    if (u <= 0) return vortex(S, t);
    var V = vortex(S, s0), ue = eio(u), Ty = TYPES[S.type];
    var tz = TH * (S.k + 1) + 0.25;
    var tx = S.jx * (1 - S.k / N * 0.6), ty = S.jy * (1 - S.k / N * 0.6);
    var tyaw = S.jyaw + (Ty.w > Ty.h ? Math.PI / 2 : 0);
    var dy = tyaw - V.yaw; dy -= Math.round(dy / (Math.PI * 2)) * Math.PI * 2;
    var bounce = u >= 1 ? 0 : 0;
    var land = Math.max(0, t - (s0 + LAND_D));
    var pz = bez(V.z, V.z + 26, tz + 46, tz, ue) + 1.6 * Math.exp(-land * 14) * Math.sin(land * 30) * (land > 0 ? 1 : 0) + bounce;
    return {
      x: bez(V.x, V.x * 0.6, tx, tx, ue), y: bez(V.y, V.y * 0.6, ty, ty, ue), z: pz,
      yaw: V.yaw + dy * ue, a: V.a * (1 - ue), b: V.b * (1 - ue), A: V.A * (1 - ue) * (1 - ue), B: V.B * (1 - ue) * (1 - ue)
    };
  }
  function fillInstances(t) {
    for (var i = 0; i < N; i++) {
      var S = SHEETS[i], p = sheetPose(S, t), Ty = TYPES[S.type], m = model(p.yaw, p.a, p.b, p.x, p.y, p.z), o = i * 27;
      for (var j = 0; j < 16; j++) INST[o + j] = m[j];
      INST[o + 16] = Ty.at[0] / AT; INST[o + 17] = Ty.at[1] / AT; INST[o + 18] = Ty.at[2] / AT; INST[o + 19] = Ty.at[3] / AT;
      INST[o + 20] = Ty.w; INST[o + 21] = Ty.h; INST[o + 22] = p.A; INST[o + 23] = p.B;
      INST[o + 24] = Ty.back[0]; INST[o + 25] = Ty.back[1]; INST[o + 26] = Ty.back[2];
    }
  }
  function grid(nx, ny) {
    var v = [];
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var x0 = i / nx, x1 = (i + 1) / nx, y0 = j / ny, y1 = (j + 1) / ny;
      v.push(x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1);
    }
    return new Float32Array(v);
  }
  function boxMesh() {
    var v = [], F = [[[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [1, 0, 0], [0, -1, 0]], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, -1, 0], [0, 0, 1]], [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]]];
    F.forEach(function (f) {
      var n = f[0], u = f[1], w = f[2];
      function P(a, b) { return [n[0] * 0.5 + u[0] * a + w[0] * b, n[1] * 0.5 + u[1] * a + w[1] * b, n[2] * 0.5 + u[2] * a + w[2] * b]; }
      [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].forEach(function (q) { var p = P(q[0], q[1]); v.push(p[0], p[1], p[2], n[0], n[1], n[2]); });
    });
    return new Float32Array(v);
  }
  var GRID_N = 0;

  function camera(t, api) {
    var W = api.W, H = api.H, L = api.logo, tall = api.mode === 'stack' || (api.mode === 'film' && H > W), rad = Math.PI / 180;
    var c = M.ease(2.05, 3.35, t);
    var top = TH * N + CT;
    var tgt = [0, 0, M.lerp(34, top * 0.55, c)];
    var tau = M.lerp(66, 43, c) * rad + api.mouse.sy * 4 * rad * c;
    var yaw = (M.lerp(-62, -24, c) + 22 * (1 - c) * Math.min(t, 2.2) / 2.2) * rad + api.mouse.sx * 7 * rad * c;
    var D = 620, fov = 30 * rad;
    var eye = [tgt[0] + D * Math.sin(tau) * Math.sin(yaw), tgt[1] - D * Math.sin(tau) * Math.cos(yaw), tgt[2] + D * Math.cos(tau)];
    var V = lookAt(eye, tgt, [0, 0, 1]);
    var Pm = persp(fov, W / H, D * 0.2, D * 6);
    var base = H / (2 * D * Math.tan(fov / 2));
    var ppu0 = tall ? Math.min(W * 0.92 / 300, H * 0.56 / 270) : Math.min(W * 0.70 / 330, H * 0.74 / 250);
    var ppu2 = L.s * 0.96 / 118;
    var ppu = M.lerp(ppu0, ppu2, c) * (1 + 0.04 * M.ease(3.0, 5.0, t));
    var s0 = tall ? [W / 2, H * 0.47] : [W / 2, H * 0.58], s2 = [L.x, L.y];
    var scr = [M.lerp(s0[0], s2[0], c), M.lerp(s0[1], s2[1], c)];
    var k = ppu / base, sx = scr[0] / W * 2 - 1, sy = 1 - scr[1] / H * 2;
    var Lm = [k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1, 0, sx, sy, 0, 1];
    return { VP: m4mul(Lm, m4mul(Pm, V)), eye: eye, ppu: ppu, tall: tall };
  }

  M.run({
    id: 'vortex', theme: 'light', bg: '#F3F5FA', textAt: 3.4, revisitAt: 2.9, skipSpeed: 5,
    accent: BLUE, accentInk: '#FFFFFF', accentHi: BLUE,
    fallbackBg: 'linear-gradient(160deg, #FFFFFF 0%, #EEF3FF 60%, #E9F1FF 100%)',
    init: function (api) {
      try { gl = api.canvas.getContext('webgl2', { antialias: true, alpha: false, depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: !!api.FILM, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
      if (!gl) return false;
      ANISO = gl.getExtension('EXT_texture_filter_anisotropic');
      P.sheet = M.glProgram(gl, VS_SHEET, FS_SHEET); P.sheetSh = M.glProgram(gl, VS_SHEET, FS_SHADOW);
      P.box = M.glProgram(gl, VS_BOX, FS_BOX); P.boxSh = M.glProgram(gl, VS_BOX, FS_BOXSH);
      P.blur = M.glProgram(gl, M.FULL_VS, FS_BLUR); P.floor = M.glProgram(gl, M.FULL_VS, FS_FLOOR);

      var g = grid(10, 14); GRID_N = g.length / 2;
      VAO.sheet = gl.createVertexArray(); gl.bindVertexArray(VAO.sheet);
      BUF.grid = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, BUF.grid); gl.bufferData(gl.ARRAY_BUFFER, g, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      BUF.inst = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, BUF.inst); gl.bufferData(gl.ARRAY_BUFFER, INST.byteLength, gl.DYNAMIC_DRAW);
      var st = 27 * 4;
      [[1, 4, 0], [2, 4, 16], [3, 4, 32], [4, 4, 48], [5, 4, 64], [6, 4, 80], [7, 3, 96]].forEach(function (a) {
        gl.enableVertexAttribArray(a[0]); gl.vertexAttribPointer(a[0], a[1], gl.FLOAT, false, st, a[2]); gl.vertexAttribDivisor(a[0], 1);
      });
      VAO.box = gl.createVertexArray(); gl.bindVertexArray(VAO.box);
      BUF.box = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, BUF.box); gl.bufferData(gl.ARRAY_BUFFER, boxMesh(), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
      VAO.empty = gl.createVertexArray(); gl.bindVertexArray(null);
      makeTextures();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { makeTextures(); try { window.dispatchEvent(new Event('resize')); } catch (e) {} });
      return true;
    },
    draw: function (t, dt, api) {
      var cw = api.canvas.width, ch = api.canvas.height, W = api.W, H = api.H;
      var C = camera(t, api), VP = C.VP, eye = C.eye;
      var veilL = api.mode === 'side' ? M.ease(2.75, 3.5, t) : 0, veilB = api.mode === 'stack' ? M.ease(2.75, 3.5, t) : 0;
      fillInstances(t);
      gl.bindBuffer(gl.ARRAY_BUFFER, BUF.inst); gl.bufferSubData(gl.ARRAY_BUFFER, 0, INST);
      var hb = stackTop(t), body = hb > 0.05;
      var bodyM = model(0, 0, 0, 0, 0, hb / 2);
      var cu = clamp((t - COVER[0]) / (COVER[1] - COVER[0]), 0, 1), ce = eio(cu), cl = Math.max(0, t - COVER[1]);
      var coverOn = t > COVER[0] - 0.02;
      var cz = M.lerp(TH * N + 150, TH * N + CT / 2 + 0.3, ce) + 1.2 * Math.exp(-cl * 12) * Math.sin(cl * 26) * (cl > 0 ? 1 : 0);
      var coverM = model(M.lerp(0.5, 0.0, ce), M.lerp(-0.35, 0, ce), M.lerp(0.2, 0, ce), M.lerp(-30, 0, ce), M.lerp(24, 0, ce), cz);

      ensureFB(cw, ch);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, FB[0].f); gl.viewport(0, 0, FBW, FBH); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(P.sheetSh.p); gl.uniformMatrix4fv(P.sheetSh.u.uVP, false, VP); gl.uniform1f(P.sheetSh.u.uShadow, 1); gl.uniform2f(P.sheetSh.u.uSh, SHD[0], SHD[1]);
      gl.bindVertexArray(VAO.sheet); gl.drawArraysInstanced(gl.TRIANGLES, 0, GRID_N, N);
      gl.useProgram(P.boxSh.p); gl.uniformMatrix4fv(P.boxSh.u.uVP, false, VP); gl.uniform1f(P.boxSh.u.uShadow, 1); gl.uniform2f(P.boxSh.u.uSh, SHD[0], SHD[1]); gl.bindVertexArray(VAO.box);
      if (body) { gl.uniformMatrix4fv(P.boxSh.u.uM, false, bodyM); gl.uniform3f(P.boxSh.u.uS, SW, SHH, hb); gl.drawArrays(gl.TRIANGLES, 0, 36); }
      if (coverOn) { gl.uniformMatrix4fv(P.boxSh.u.uM, false, coverM); gl.uniform3f(P.boxSh.u.uS, CW, CH, CT); gl.drawArrays(gl.TRIANGLES, 0, 36); }
      gl.disable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
      gl.useProgram(P.blur.p); gl.bindVertexArray(VAO.empty); gl.uniform2f(P.blur.u.uSize, FBW, FBH); gl.uniform1i(P.blur.u.uS, 0); gl.activeTexture(gl.TEXTURE0);
      var px = 1 / FBW, py = 1 / FBH, spread = Math.max(1, api.dpr * C.ppu / 2.2);
      [[1.6, 0, 0.45, 0], [0, 1.6, 0, 0.45], [3.2, 0, 0.7, 0], [0, 3.2, 0, 0.7]].forEach(function (s, i) {
        var src = FB[i % 2], dst = FB[(i + 1) % 2];
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.f); gl.bindTexture(gl.TEXTURE_2D, src.t);
        gl.uniform2f(P.blur.u.uR, s[0] * px * spread, s[1] * py * spread); gl.uniform2f(P.blur.u.uG, s[2] * px * spread, s[3] * py * spread);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });

      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cw, ch);
      gl.useProgram(P.floor.p); gl.bindVertexArray(VAO.empty); gl.bindTexture(gl.TEXTURE_2D, FB[0].t);
      gl.uniform2f(P.floor.u.uRes, cw, ch); gl.uniformMatrix4fv(P.floor.u.uInv, false, m4inv(VP)); gl.uniform1i(P.floor.u.uS, 0);
      gl.uniform1f(P.floor.u.uLeft, veilL); gl.uniform1f(P.floor.u.uBottom, veilB); gl.uniform3f(P.floor.u.uEye, eye[0], eye[1], eye[2]); gl.uniform2f(P.floor.u.uKey, -80, 90);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(P.box.p); gl.bindVertexArray(VAO.box);
      gl.uniformMatrix4fv(P.box.u.uVP, false, VP); gl.uniform1f(P.box.u.uShadow, 0); gl.uniform3f(P.box.u.uEye, eye[0], eye[1], eye[2]); gl.uniform3f(P.box.u.uL, LIGHT[0], LIGHT[1], LIGHT[2]);
      gl.uniform2f(P.box.u.uRes, cw, ch); gl.uniform1f(P.box.u.uLeft, veilL); gl.uniform1f(P.box.u.uBottom, veilB); gl.uniform1f(P.box.u.uTh, TH); gl.uniform1i(P.box.u.uTex, 0);
      gl.uniform1f(P.box.u.uSweep, M.lerp(-120, 140, M.sstep(3.0, 3.9, t)));
      if (body) { gl.uniformMatrix4fv(P.box.u.uM, false, bodyM); gl.uniform3f(P.box.u.uS, SW, SHH, hb); gl.uniform1f(P.box.u.uKind, 0); gl.drawArrays(gl.TRIANGLES, 0, 36); }
      if (coverOn) { gl.bindTexture(gl.TEXTURE_2D, COVER_TEX); gl.uniformMatrix4fv(P.box.u.uM, false, coverM); gl.uniform3f(P.box.u.uS, CW, CH, CT); gl.uniform1f(P.box.u.uKind, 1); gl.drawArrays(gl.TRIANGLES, 0, 36); }
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -1);
      gl.useProgram(P.sheet.p); gl.bindVertexArray(VAO.sheet); gl.bindTexture(gl.TEXTURE_2D, ATLAS);
      gl.uniformMatrix4fv(P.sheet.u.uVP, false, VP); gl.uniform1f(P.sheet.u.uShadow, 0); gl.uniform3f(P.sheet.u.uEye, eye[0], eye[1], eye[2]); gl.uniform3f(P.sheet.u.uL, LIGHT[0], LIGHT[1], LIGHT[2]);
      gl.uniform1i(P.sheet.u.uTex, 0); gl.uniform2f(P.sheet.u.uRes, cw, ch); gl.uniform1f(P.sheet.u.uLeft, veilL); gl.uniform1f(P.sheet.u.uBottom, veilB);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, GRID_N, N);
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.disable(gl.DEPTH_TEST); gl.bindVertexArray(null);
    },
    finish: function () { if (gl) gl.finish(); }
  });
})();
