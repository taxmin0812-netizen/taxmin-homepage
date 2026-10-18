(function () {
  'use strict';

  var KAKAO = 'https://pf.kakao.com/_Mxojqs/chat';
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var words = [];
  $$('[data-words]').forEach(function (el) {
    var ws = el.textContent.trim().split(/\s+/);

    var from = ws.indexOf('한', 4), to = ws.indexOf('확인하고,'), box = el, grp = null;
    el.textContent = '';
    ws.forEach(function (w, k) {
      if (k === from && to > from) { grp = document.createElement('span'); grp.className = 'nw'; el.appendChild(grp); box = grp; }
      var sp = document.createElement('span');
      sp.className = 'w' + ((k >= from && k <= to && from > 0) || w === '미리' ? ' key' : '');
      sp.textContent = w;
      box.appendChild(sp);
      if (k === to && grp) { box = el; grp = null; }
      if (k < ws.length - 1) (grp || el).appendChild(document.createTextNode(' '));
    });
    words = words.concat($$('.w', el));
  });
  var statement = $('.statement-text');

  var header = $('#site-header');
  var hero = $('#hero');
  var fcta = $('.float-cta');
  var chapters = $$('.chapter'), chapterNav = $$('.chapter-nav li');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset, vh = window.innerHeight;
    header.classList.toggle('is-scrolled', y > 8);

    var dark = false;
    if (hero && hero.getAttribute('data-theme') !== 'light') {
      var r = hero.getBoundingClientRect(), probe = (header.offsetHeight || 72) / 2;
      dark = r.top <= probe && r.bottom >= probe;
    }
    header.classList.toggle('on-dark', dark);
    header.classList.toggle('on-light', !dark);

    if (fcta) {
      var near = $$('.contact-head, .site-footer').some(function (el) { var b = el.getBoundingClientRect(); return b.top < vh - 40 && b.bottom > 0; });
      fcta.classList.toggle('show', !near);
    }

    if (statement && words.length) {
      var rs = statement.getBoundingClientRect();
      var p = (vh * 0.85 - rs.top) / (rs.height + vh * 0.5);
      var n = reduce ? words.length : Math.round(Math.max(0, Math.min(1, p)) * words.length * 1.15);
      words.forEach(function (w, k) { w.classList.toggle('on', k < n); });
    }

    if (chapters.length) {
      var on = 0;
      chapters.forEach(function (c, k) { if (c.getBoundingClientRect().top < vh * 0.55) on = k; });
      chapterNav.forEach(function (li, k) { li.classList.toggle('on', k === on); });
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('min:theme', onScroll);
  document.addEventListener('min:intro-done', onScroll);
  onScroll();

  var menuBtn = $('.menu-btn'), menu = $('#mobile-menu');
  if (menuBtn && menu) {
    var closeMenu = function () { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', '메뉴 열기'); menu.hidden = true; header.classList.remove('menu-open'); document.body.style.overflow = ''; };
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      menu.hidden = !open;
      header.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) html.classList.add('intro-done');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); } });
  }

  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  var wtabs = $$('.who-tab');
  function selectWho(tab, focus) {
    wtabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  wtabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectWho(t); });
    t.addEventListener('keydown', function (e) {
      var j = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? i + 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? wtabs.length - 1 : null;
      if (j === null) return;
      e.preventDefault();
      selectWho(wtabs[(j + wtabs.length) % wtabs.length], true);
    });
  });
  if (wtabs.length && /^#tab-[a-z]+$/.test(location.hash)) {
    var want = $(location.hash);
    if (want && want.classList.contains('who-tab')) {
      selectWho(want);
      var box = $('.who-box');
      if (box) setTimeout(function () { box.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }, 120);
    }
  }

  $$('.faq details').forEach(function (d) {
    var sum = $('summary', d), body = $('.faq-a', d);
    sum.addEventListener('click', function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var h2 = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h2 + 'px', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  });

  (function () {
    var mg = $('#mg');
    if (!mg) return;
    var steps = $$('.mg-steps li', mg), works = $$('.mw', mg), list = $('.kp-list', mg), link = $('.mg-link', mg);
    var D = 3600, cur = -1, timer = null, live = false, ts = [];
    var MSG = [
      [{ t: 't', h: '사장님, <b>7월 매출 보고서</b> 보내 드려요.', c: ['7월 매출', '5,376만원 ↗'] }],
      [{ t: 't', h: '이번 달 <b>원천세 신고</b> 마쳤어요.', c: ['직원 3명', '신고 완료 ✓'] }],
      [{ t: 't', h: '<b>상반기 가결산</b>이에요. 예상 세액을 미리 알려 드려요.', c: ['예상 세액', '1,230만원'] }],
      [{ t: 't', h: '두 세무사가 <b>한 번 더 확인</b>했어요. 이제 신고할게요.' }],
      [{ t: 'u', h: '영수증 사진 보낼게요!', p: 1 }, { t: 't', h: '받았어요. 장부에 바로 반영할게요.' }]
    ];
    function later(f, ms) { ts.push(setTimeout(f, ms)); }
    function clearT() { ts.forEach(clearTimeout); ts = []; clearTimeout(timer); }
    function now() { var d = new Date(); return (d.getHours() < 12 ? '오전 ' : '오후 ') + ((d.getHours() + 11) % 12 + 1) + ':' + ('0' + d.getMinutes()).slice(-2); }
    function bubble(m) {
      var el = document.createElement('div');
      el.className = 'kp-msg kp-' + m.t;
      el.innerHTML = (m.t === 't' ? '<span class="kp-av"><svg><use href="#tm-mark"/></svg></span>' : '') +
        '<div class="kp-b">' + (m.p ? '<span class="kp-ph"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/></svg>사진</span>' : '') + m.h +
        (m.c ? '<span class="kp-card"><span>' + m.c[0] + '</span><b>' + m.c[1] + '</b></span>' : '') + '</div><span class="kp-tm">' + now() + '</span>';
      list.appendChild(el);
      while (list.children.length > 5) list.removeChild(list.firstChild);
      requestAnimationFrame(function () { el.classList.add('in'); });
    }
    function count(w) {
      $$('[data-count]', w).forEach(function (b) {
        var to = +b.getAttribute('data-count'), t0 = null;
        if (reduce) return;
        function f(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 900), v = Math.round(to * (1 - Math.pow(1 - k, 3))); b.textContent = v.toLocaleString('ko-KR'); if (k < 1) requestAnimationFrame(f); }
        requestAnimationFrame(f);
      });
    }
    function pulse(dir) { link.classList.remove('fwd', 'rev'); void link.offsetWidth; link.classList.add(dir); }
    function go(i) {
      clearT(); cur = i;
      steps.forEach(function (li, k) { li.classList.toggle('on', k === i); });
      works.forEach(function (w, k) { w.classList.toggle('on', k === i); });
      if (i === 0) { list.innerHTML = ''; bubble({ t: 't', h: '사장님, 이번 달 <b>신고 일정</b> 미리 알려 드려요.', c: ['원천세 신고', '매월 10일까지'] }); }
      count(works[i]);
      if (i < 4) { later(function () { pulse('fwd'); }, 1300); later(function () { MSG[i].forEach(bubble); }, 1900); }
      else { later(function () { bubble(MSG[4][0]); }, 300); later(function () { pulse('rev'); }, 900); later(function () { bubble(MSG[4][1]); }, 2300); }
      if (live && !reduce && !manual && !paused) timer = setTimeout(function () { go((cur + 1) % 5); }, D);
    }
    var manual = false, paused = false;
    steps.forEach(function (li, k) { $('button', li).addEventListener('click', function () { manual = true; mg.classList.add('is-manual'); go(k); }); });
    function hold(v) { paused = v; if (v) clearTimeout(timer); else if (live && !manual && !reduce) { clearTimeout(timer); timer = setTimeout(function () { go((cur + 1) % 5); }, D); } }
    mg.addEventListener('mouseenter', function () { hold(true); });
    mg.addEventListener('mouseleave', function () { hold(false); });
    mg.addEventListener('focusin', function () { hold(true); });
    mg.addEventListener('focusout', function () { hold(false); });
    if (reduce) { MSG.forEach(function (g) { g.forEach(bubble); }); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !live) { live = true; go(cur < 0 ? 0 : cur); }
          else if (!e.isIntersecting && live) { live = false; clearT(); }
        });
      }, { threshold: 0.35 }).observe(mg);
    } else { live = true; go(0); }
  })();

  (function () {
    var nav = $$('.faq-nav li'), gs = $$('.faq-group');
    if (!nav.length || !gs.length) return;
    function spy() {
      var on = 0;
      gs.forEach(function (g, k) { if (g.getBoundingClientRect().top < window.innerHeight * 0.45) on = k; });
      nav.forEach(function (li, k) { li.classList.toggle('on', k === on); });
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(spy); }, { passive: true });
    spy();
  })();

  $$('.copy-addr').forEach(function (bt) {
    bt.addEventListener('click', function () {
      var t = bt.getAttribute('data-copy'), ok = function () { bt.textContent = '복사했어요'; setTimeout(function () { bt.textContent = '주소 복사'; }, 1800); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, function () {});
      else { var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta); }
    });
  });

  (function () {
    var map = $('.fmap');
    if (!map) return;
    var rows = $$('.fl-list li'), nodes = $$('.fm-node', map), cur = 0, hold = false;
    function on(k) {
      rows.forEach(function (r) { r.classList.toggle('on', r.getAttribute('data-k') === k); });
      nodes.forEach(function (n) { n.classList.toggle('on', n.getAttribute('data-k') === k); });
    }
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { hold = true; cur = +r.getAttribute('data-k'); on(String(cur)); });
      r.addEventListener('mouseleave', function () { hold = false; });
    });
    on('1'); cur = 1;
    if (!reduce) setInterval(function () { if (hold || document.hidden) return; cur = cur % 8 + 1; on(String(cur)); }, 2400);
  })();

  (function () {
    var track = $('.yt-track');
    if (!track) return;
    var bar = $('.yt-bar'), thumb = bar && $('i', bar);
    function step() { var c = $('.yt-card', track); if (!c) return track.clientWidth; return c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16); }
    function update() {
      if (!thumb) return;
      var sw = track.scrollWidth, cw = track.clientWidth, max = sw - cw;
      bar.hidden = max <= 2;
      track.classList.toggle('at-end', track.scrollLeft >= max - 2);
      var w = sw ? cw / sw : 1;
      thumb.style.width = (w * 100) + '%';
      thumb.style.transform = 'translateX(' + (max > 0 ? (track.scrollLeft / max) * (1 / w - 1) * 100 : 0) + '%)';
    }
    var down = false, moved = false, sx = 0, sl = 0, lx = 0, lt = 0, vx = 0, timer = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = lx = e.clientX; sl = track.scrollLeft; lt = e.timeStamp; vx = 0;
      clearTimeout(timer);
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-drag'); }
      if (!moved) return;
      track.scrollLeft = sl - dx;
      var dt = e.timeStamp - lt; if (dt > 0) vx = (e.clientX - lx) / dt;
      lx = e.clientX; lt = e.timeStamp;
    });
    function end() {
      if (!down) return;
      down = false;
      if (!moved) return;
      var s = step(), cur = track.scrollLeft / s, i = Math.round(cur);
      if (Math.abs(vx) > 0.25) i = vx < 0 ? Math.ceil(cur) : Math.floor(cur);
      track.scrollTo({ left: Math.max(0, i) * s, behavior: reduce ? 'auto' : 'smooth' });
      timer = setTimeout(function () { track.classList.remove('is-drag'); }, reduce ? 0 : 450);
    }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  })();

  (function () {
    var ARROW = '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>';
    var CHECK = '<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>';
    var CALC = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="5" width="30" height="38" rx="7" fill="#fff"/><rect x="14" y="10" width="20" height="8" rx="2.5" fill="#C9D8FF"/><g fill="#9DB3E8"><circle cx="17" cy="25" r="2.4"/><circle cx="24" cy="25" r="2.4"/><circle cx="31" cy="25" r="2.4"/><circle cx="17" cy="32" r="2.4"/><circle cx="24" cy="32" r="2.4"/></g><circle cx="34" cy="35" r="9" fill="#3673F7"/><path d="M29.5 35l3 3 6-6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var HTML = '<dialog class="apply-dlg" id="apply-dlg" aria-labelledby="apply-title">' +
      '<div class="dlg-in">' +
      '<button class="dlg-x" type="button" aria-label="닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +

      '<div class="dlg-step" data-step="choose">' +
      '<p class="dlg-k">상담 신청</p><h2 id="apply-title" class="dlg-h">어떤 상담이<br>필요하신가요?</h2>' +
      '<p class="dlg-lead">상담 내용에 맞는 창구를 고르시면 더 빠르게 안내해 드립니다.</p>' +
      '<div class="dlg-cards">' +

      '<article class="dc dc-main"><span class="dc-tag">세무기장 계약 문의</span><h3>세무기장 상담</h3><p class="dc-desc">장부 정리와 세금 신고를 맡기고, 매달 보고까지 받는 세무기장을 상담합니다. 기장료를 계산한 뒤 신청서를 남겨 주시면 담당 세무사가 연락드립니다.</p>' +
      '<ul class="dc-checks"><li>' + CHECK + '사장님 매출에 맞는 요금제와 예상 기장료를 바로 알려 드립니다.</li><li>' + CHECK + '다른 세무사무소에서 옮겨 오셔도 이전 장부까지 도와 드립니다.</li><li>' + CHECK + '계약 전에도 편하게 물어보세요.</li></ul>' +
      '<button class="btn btn-accent btn-block" type="button" data-go="calc">기장료 계산하고 신청하기' + ARROW + '</button></article>' +
      '<article class="dc"><span class="dc-tag dc-tag-k">카카오톡 채널</span><h3>세금 질문 · 신고 상담</h3><p class="dc-desc">부가가치세·종합소득세 신고, 양도·증여·상속, 창업처럼 궁금한 세금 이야기는 카카오톡 채널로 편하게 물어보세요.</p>' +
      '<ul class="dc-checks"><li>' + CHECK + '궁금할 때 카카오톡으로 바로 물어보세요.</li><li>' + CHECK + '영수증·자료 사진도 카카오톡으로 바로 보낼 수 있습니다.</li></ul>' +
      '<a class="btn btn-kakao btn-block" href="' + KAKAO + '" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-kakao"/></svg>카카오톡 상담</a></article>' +
      '</div>' +
      '<p class="dlg-alt">전화 상담 <a href="tel:0507-1428-6446">0507-1428-6446</a> · 평일 10:00 ~ 17:30</p>' +
      '</div>' +

      '<div class="dlg-step" data-step="calc" hidden>' +
      '<button class="dlg-back" type="button" data-back="choose"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>창구 다시 고르기</button>' +
      '<p class="dlg-k">1단계 · 기장료 계산</p><h2 class="dlg-h dlg-h-form">먼저 기장료를 확인해 볼까요?</h2>' +
      '<p class="dlg-lead">계산한 내용이 신청서에 그대로 담겨, 담당 세무사가 더 빨리 안내해 드립니다. 기장 상담이 아니시면 <a href="' + KAKAO + '" target="_blank" rel="noopener">카카오톡</a>이나 전화(0507-1428-6446)로 바로 문의해 주세요.</p>' +
      '<div class="calc-box calc-in-dlg" id="dlg-calc"></div>' +
      '</div>' +

      '<div class="dlg-step" data-step="form" hidden>' +
      '<button class="dlg-back dlg-recalc" type="button" data-back="calc"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/></svg>기장료 다시 계산하기</button>' +
      '<form class="apply" id="apply" action="https://formsubmit.co/tax-min@naver.com" method="POST" accept-charset="UTF-8">' +
      '<p class="dlg-k">2단계 · 상담 신청서</p><h2 class="dlg-h dlg-h-form">상담 신청서</h2>' +
      '<div class="calc-sum" id="calc-sum"></div>' +
      '<fieldset class="choice" data-key="issue"><legend>가장 궁금한 것 <i>(선택)</i></legend><button type="button">세무대리인 변경·기장</button><button type="button">창업·중소기업 세액감면</button><button type="button">양도·상속·증여 미리 상담</button><button type="button">경비·공제 점검</button><button type="button">기타</button></fieldset>' +
      '<input type="hidden" name="사업 형태" id="f-type"><input type="hidden" name="업종" id="f-ind"><input type="hidden" name="작년 매출" id="f-sales"><input type="hidden" name="장부" id="f-book"><input type="hidden" name="맞는 요금제" id="f-plan"><input type="hidden" name="인건비 신고" id="f-staff"><input type="hidden" name="궁금한 것" id="f-issue">' +
      '<div class="fields">' +
      '<label class="fld"><span>이름 또는 상호 <b aria-hidden="true">*</b></span><input name="이름" id="f-name" required maxlength="40" autocomplete="name" placeholder="홍길동 / 길동상회"></label>' +
      '<label class="fld"><span>연락처 <b aria-hidden="true">*</b></span><input name="연락처" id="f-tel" type="tel" required maxlength="20" autocomplete="tel" inputmode="tel" pattern="[0-9 +\\-\\(\\)]{9,20}" placeholder="010-0000-0000"></label>' +
      '<label class="fld fld-wide"><span>남기실 말씀 <i>(선택)</i></span><textarea name="남기실 말씀" id="f-msg" rows="3" maxlength="1000" placeholder="예) 지금 다른 세무사무소에 맡기고 있는데 옮기고 싶어요"></textarea><span class="fld-note">주민등록번호·계좌번호 같은 정보는 적지 말아 주세요.</span></label>' +
      '</div>' +
      '<label class="agree"><input type="checkbox" name="개인정보 수집·이용 동의" value="동의함" id="f-agree" required><span>개인정보 수집·이용에 동의합니다 <b>(필수)</b></span></label>' +
      '<p class="agree-note">받는 정보: 이름(상호)·연락처·계산하고 적은 내용 · 쓰는 곳: 상담 연락 · 보관: 상담이 끝나고 1년 뒤 지움 · <a href="privacy.html#apply-info">자세히</a><br>동의하지 않으셔도 카카오톡이나 전화로 상담하실 수 있습니다.</p>' +
      '<div class="hp" aria-hidden="true"><label>비워 두세요<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>' +
      '<input type="hidden" name="_subject" value="[택스민 홈페이지] 상담 신청"><input type="hidden" name="_template" value="table">' +
      '<div class="apply-actions"><button class="btn btn-accent" type="submit" id="apply-send">상담 신청하기' + ARROW + '</button>' +
      '<button class="btn btn-ghost" type="button" id="prep-go"><svg class="ico" aria-hidden="true"><use href="#i-kakao"/></svg>계산 내용 카카오톡으로 보내기</button></div>' +
      '<p class="apply-msg" id="apply-msg" role="status" aria-live="polite" hidden></p>' +
      '<div class="prep-done" id="prep-done" hidden><p class="pd-msg"></p><pre class="pd-text" hidden></pre>' +
      '<a class="btn btn-kakao btn-block" href="' + KAKAO + '" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-kakao"/></svg>카카오톡 열기</a></div>' +
      '<p class="dlg-alt">전화 상담 <a href="tel:0507-1428-6446">0507-1428-6446</a> · 평일 10:00 ~ 17:30</p>' +
      '</form></div></div></dialog>';

    var dlg = null, form, pick, hid, msg, send, done, SEND_TEXT, calcData = null, calcMounted = false;
    function build() {
      if (dlg) return;
      var wrap = document.createElement('div');
      wrap.innerHTML = HTML;
      dlg = wrap.firstChild;
      document.body.appendChild(dlg);
      form = $('#apply', dlg);
      pick = { issue: '' };
      hid = { issue: $('#f-issue', dlg) };
      msg = $('#apply-msg', dlg); send = $('#apply-send', dlg); done = $('#prep-done', dlg);
      SEND_TEXT = send.innerHTML;
      $$('.choice', form).forEach(function (fs) {
        var key = fs.getAttribute('data-key');
        $$('button', fs).forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', function () {
            var on = b.getAttribute('aria-pressed') !== 'true';
            $$('button', fs).forEach(function (x) { x.setAttribute('aria-pressed', on && x === b ? 'true' : 'false'); });
            pick[key] = on ? b.textContent.trim() : '';
            if (hid[key]) hid[key].value = pick[key];
            done.hidden = true;
          });
        });
      });
      $('#prep-go', dlg).addEventListener('click', function () {

        var t = text(), msgEl = $('.pd-msg', done), pre = $('.pd-text', done);
        copy(t).then(function () {
          msgEl.innerHTML = '<b>계산 내용을 복사했어요.</b> 아래 <b>카카오톡 열기</b>를 누른 뒤, 채팅 입력창에 <b>붙여 넣어</b>(휴대폰은 꾹 누르기, PC는 Ctrl+V) 보내 주세요.';
          pre.hidden = true;
        }, function () {
          msgEl.innerHTML = '<b>자동 복사가 안 됐어요.</b> 아래 내용을 복사(휴대폰은 꾹 누르기, PC는 끌어서 Ctrl+C)한 뒤, 카카오톡 채팅창에 붙여 넣어 주세요.';
          pre.textContent = t; pre.hidden = false;
        });
        done.hidden = false;
        try { done.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
      });
      $('.dlg-x', dlg).addEventListener('click', close);
      $$('[data-go]', dlg).forEach(function (b) { b.addEventListener('click', function () { step(b.getAttribute('data-go')); }); });
      $$('[data-back]', dlg).forEach(function (b) { b.addEventListener('click', function () { step(b.getAttribute('data-back')); }); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
      dlg.addEventListener('close', function () { document.documentElement.classList.remove('dlg-open'); if (location.hash === '#apply') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} } });
      form.addEventListener('submit', submit);
    }
    function mountCalc() {
      if (calcMounted || !window.TaxminFee) return;
      calcMounted = true;
      window.TaxminFee.mount($('#dlg-calc', dlg), {
        applyText: '이 내용으로 상담 신청서 쓰기',
        onApply: function (d) { setCalc(d); step('form'); },
        scrollTo: function (el) { try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }
      });
    }
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function setCalc(d) {
      calcData = d;
      var map = { 'f-type': d.type, 'f-ind': d.industry, 'f-sales': d.sales, 'f-book': d.book, 'f-plan': d.plan + ' ' + (d.est ? '예상 ' : '') + d.price + ' (부가세 별도)', 'f-staff': d.staff };
      Object.keys(map).forEach(function (id) { $('#' + id, dlg).value = map[id]; });
      $('#calc-sum', dlg).innerHTML = '<div class="cs-top"><span>계산한 내용</span><button type="button" data-back2="calc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4.2L19.4 8.8a2.1 2.1 0 0 0 0-3L18.2 4.6a2.1 2.1 0 0 0-3 0L4 15.8z"/><path d="M13.6 6.2l4.2 4.2"/></svg>고치기</button></div>' +
        '<p class="cs-plan">추천 요금제 <b>' + esc(d.plan) + '</b> · ' + '<span class="nw">' + (d.est ? '예상 ' : '') + esc(d.price) + '</span> <small>부가세 별도</small></p>' +
        '<p class="cs-rows">' + [d.type, d.industry, d.sales, '인건비 신고 ' + d.staff].map(esc).join(' · ') + '</p>';
      $('[data-back2]', dlg).addEventListener('click', function () { step('calc'); });
    }
    function text() {
      var d = calcData || {};
      return '[택스민 상담 신청]\n사업 형태: ' + (d.type || '-') + '\n업종: ' + (d.industry || '-') + '\n작년 매출: ' + (d.sales || '-') + '\n장부: ' + (d.book || '-') +
        '\n맞는 요금제: ' + (d.plan ? d.plan + ' ' + (d.est ? '예상 ' : '') + d.price : '-') + '\n인건비 신고: ' + (d.staff || '-') + '\n궁금한 것: ' + (pick.issue || '-');
    }
    function chips() {
      $$('.choice', form).forEach(function (fs) {
        var key = fs.getAttribute('data-key');
        $$('button', fs).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        pick[key] = ''; if (hid[key]) hid[key].value = '';
      });
    }
    function copy(s) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s);
      return new Promise(function (res, rej) {
        var ta = document.createElement('textarea');
        ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); }
        document.body.removeChild(ta);
      });
    }
    function say(ok, t) {
      msg.hidden = false; msg.textContent = t;
      msg.classList.toggle('is-ok', ok); msg.classList.toggle('is-err', !ok);
      try { msg.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }
    function step(name) {
      if (name === 'form' && !calcData) name = 'calc';
      if (name === 'calc') mountCalc();
      $$('.dlg-step', dlg).forEach(function (el) { el.hidden = el.getAttribute('data-step') !== name; });
      dlg.classList.toggle('is-form', name === 'form');
      dlg.scrollTop = 0;
      var h = $('.dlg-step[data-step="' + name + '"] h2', dlg);
      if (h) { if (!h.id) h.id = 'apply-title-' + name; dlg.setAttribute('aria-labelledby', h.id); }

      dlg.setAttribute('tabindex', '-1'); try { dlg.focus({ preventScroll: true }); } catch (e) {}
    }
    function setChip(key, label) {
      if (!label) return;
      $$('.choice[data-key="' + key + '"] button', form).forEach(function (b) {
        var on = b.textContent.trim() === label;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) { pick[key] = label; if (hid[key]) hid[key].value = label; }
      });
    }
    function open(opts) {
      opts = opts || {};
      build();
      msg.hidden = true; done.hidden = true;
      if (opts.calc) setCalc(opts.calc);
      step(opts.calc ? 'form' : (opts.step === 'form' || opts.step === 'calc') ? opts.step : 'choose');
      if (opts.prefill && opts.prefill.issue) setChip('issue', opts.prefill.issue);
      document.documentElement.classList.add('dlg-open');
      if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
      dlg.setAttribute('tabindex', '-1'); try { dlg.focus({ preventScroll: true }); } catch (e) {}
      dlg.scrollTop = 0;
    }
    function close() {
      if (!dlg) return;
      if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else { dlg.removeAttribute('open'); document.documentElement.classList.remove('dlg-open'); }
    }
    function submit(e) {
      e.preventDefault();
      var tel = $('#f-tel', form); tel.setCustomValidity(tel.validity.patternMismatch ? '010-0000-0000처럼 숫자로 적어 주세요.' : '');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var hp = form.querySelector('input[name="_honey"]');
      if (hp && hp.value) { form.reset(); chips(); say(true, '상담 신청이 접수되었습니다.'); return; }
      var data = {};
      $$('input, textarea', form).forEach(function (el) {
        if (!el.name || el.name === '_honey' || (el.type === 'checkbox' && !el.checked)) return;
        data[el.name] = el.value.trim() || '-';
      });
      data._subject = '[택스민 홈페이지] 상담 신청 — ' + ($('#f-name', form).value.trim() || '이름 없음');
      data['보낸 곳'] = 'taxmin.kr 상담 신청서';
      send.disabled = true; send.textContent = '보내는 중…'; msg.hidden = true;
      var ac = window.AbortController ? new AbortController() : null, tmo = ac ? setTimeout(function () { ac.abort(); }, 15000) : 0;
      fetch(form.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        signal: ac ? ac.signal : undefined,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        if (res.ok && String(res.j.success) === 'true') {
          form.reset(); chips();
          say(true, '상담 신청이 접수되었습니다. 확인하는 대로 연락드리겠습니다.');
          calcData = null;
        } else {
          say(false, '지금은 신청서를 보내지 못했습니다. 카카오톡이나 전화(0507-1428-6446)로 연락 주세요.');
        }
      }, function () {
        say(false, '인터넷 연결 때문에 보내지 못했습니다. 잠시 뒤 다시 보내거나 카카오톡·전화로 연락 주세요.');
      }).then(function () { clearTimeout(tmo); send.disabled = false; send.innerHTML = SEND_TEXT; });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="#apply"], [data-apply]');
      if (!a) return;
      e.preventDefault();
      var hd = $('.site-header'); if (hd && hd.classList.contains('menu-open')) { var mb = $('.menu-btn'); if (mb) mb.click(); }
      open({ step: a.getAttribute('data-apply') === 'form' ? 'form' : 'choose' });
    });
    if (location.hash === '#apply') open();
    window.TaxminApply = { open: open, close: close };
  })();
})();
