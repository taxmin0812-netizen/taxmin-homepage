(function () {
  'use strict';
  var START = { lite: 50000, standard: 70000, corp: 120000 };

  var IND = [
    ['retail', '도소매업 · 무역업', 30000, 'A'],
    ['online', '온라인 판매 · 전자상거래', 30000, 'A'],
    ['food', '음식점 · 카페 · 숙박업', 15000, 'B'],
    ['mfg', '제조업', 15000, 'B'],
    ['build', '건설업 · 인테리어', 15000, 'B'],
    ['trans', '운수업 · 물류 · 택배', 15000, 'B'],
    ['it', '정보통신업(IT · 소프트웨어)', 15000, 'B'],
    ['biz', '전문 서비스(컨설팅 · 디자인 · 광고)', 7500, 'C'],
    ['edu', '교육 서비스(학원 · 교습소)', 7500, 'C'],
    ['personal', '개인 서비스(미용 · 네일 · 세탁 · 수리)', 7500, 'C'],
    ['creator', '프리랜서 · 크리에이터 · 인플루언서', 7500, 'C'],
    ['rent', '부동산 임대업', 7500, 'C'],
    ['leisure', '보건 · 예술 · 스포츠 · 여가 서비스', 7500, 'C'],
    ['pro', '전문직(의료 · 법률 · 세무 · 회계 등)', 0, 'C'],
    ['etc', '기타 · 잘 모르겠어요', 7500, 'C']
  ];

  var BANDS = {
    personal: {
      A: [[50000, 70000, 90000], [100000, 90000, 110000], [200000, 110000, 140000], [300000, 140000, 170000]],
      B: [[30000, 70000, 90000], [50000, 90000, 110000], [100000, 110000, 130000], [200000, 130000, 160000]],
      C: [[15000, 70000, 90000], [30000, 90000, 110000], [50000, 110000, 130000], [100000, 130000, 160000]]
    },
    corp: {
      A: [[30000, 120000, 150000], [50000, 150000, 170000], [100000, 170000, 200000], [200000, 200000, 240000]],
      B: [[15000, 120000, 150000], [30000, 150000, 170000], [50000, 170000, 190000], [100000, 190000, 220000]],
      C: [[10000, 120000, 150000], [30000, 150000, 170000], [50000, 170000, 200000], [100000, 200000, 230000]]
    }
  };
  var LITE_STAFF = 5;
  function band(rows, m) {
    for (var i = 0; i < rows.length; i++) if (m < rows[i][0]) return { lo: rows[i][1], hi: rows[i][2] };
    return { lo: rows[rows.length - 1][2], hi: 0, consult: true };
  }
  function staffAdd(n) { return n > 10 ? 30000 : n > 5 ? 10000 : 0; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function man(n) { return String(Math.round(n / 1000) / 10); }
  function won(n) { return (Math.round(n / 1000) / 10).toString() + '만원'; }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function eok(m) {
    if (!m) return '-';
    var e = Math.floor(m / 10000), r = m % 10000;
    if (!e) return comma(r) + '만원';
    return e + '억' + (r ? ' ' + comma(r) + '만' : '') + '원';
  }
  var uid = 0;

  function mount(root, opts) {
    opts = opts || {};
    var k = 'fc' + (++uid);
    var ARROW = '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>';
    root.innerHTML =
      '<form class="calc-form" novalidate>' +
      '<fieldset class="cq"><legend><i>1</i>사업자 유형</legend><div class="seg" data-name="type"><button type="button" class="on" data-v="personal">개인사업자</button><button type="button" data-v="corp">법인사업자</button></div></fieldset>' +
      '<fieldset class="cq"><legend><i>2</i>업종</legend><select class="f-ind" aria-label="업종">' + IND.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></fieldset>' +
      '<fieldset class="cq"><legend><i>3</i>작년 매출액</legend>' +
      '<div class="seg" data-name="period"><button type="button" class="on" data-v="year">연 매출</button><button type="button" data-v="month">월 평균 매출</button></div>' +
      '<label class="num"><input class="f-sales" inputmode="numeric" autocomplete="off" placeholder="예) 30,000" aria-label="매출액(만원)"><span>만원</span></label>' +
      '<div class="num-row"><label class="chk"><input type="checkbox" class="f-new"><span>올해 새로 시작한 사업이에요</span></label><p class="num-hint" aria-live="polite"></p></div>' +
      '</fieldset>' +
      '<fieldset class="cq"><legend><i>4</i>인건비 신고</legend><div class="seg" data-name="staff"><button type="button" class="on" data-v="no">없습니다</button><button type="button" data-v="yes">인건비 신고가 있습니다</button></div>' +
      '<div class="staff-row" hidden><label class="fl"><span class="nl">4대보험 직원 수</span><span class="num"><input class="f-emp" inputmode="numeric" autocomplete="off" placeholder="0"><span>명</span></span></label>' +
      '<label class="fl"><span class="nl">프리랜서(3.3%) 수</span><span class="num"><input class="f-free" inputmode="numeric" autocomplete="off" placeholder="0"><span>명</span></span></label></div></fieldset>' +
      '<p class="calc-err" aria-live="assertive" hidden></p>' +
      '<div class="calc-actions"><button type="button" class="calc-reset"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg>초기화</button>' +
      '<button type="submit" class="btn btn-accent btn-block btn-lg">' + (opts.submitText || '계산하기') + (opts.submitText ? ARROW : '') + '</button></div>' +
      '</form>' +
      (opts.resultEl ? '' : '<div class="calc-result" aria-live="polite"></div>');

    var form = root.querySelector('.calc-form'), out = opts.resultEl || root.querySelector('.calc-result');
    if (opts.resultEl) { out.classList.add('calc-result'); out.setAttribute('aria-live', 'polite'); root.classList.add('calc-split'); }
    var $ = function (s) { return root.querySelector(s); };
    var st = { type: 'personal', period: 'year', staff: 'no' };
    var EMPTY = '<div class="cr-empty"><p class="cr-k">택스민 기장료</p><ul class="cr-plans">' +
      '<li><span>택스민 라이트</span><b>월 ' + won(START.lite) + '</b></li>' +
      '<li><span>스탠다드 기장</span><b>월 ' + won(START.standard) + '~</b></li>' +
      '<li><span>법인 기장</span><b>월 ' + won(START.corp) + '~</b></li></ul>' +
      '<p class="cr-plans-vat">부가세 별도</p><p>내용을 고르고 <b>계산하기</b>를 누르면<br>사장님 매출에 맞는 요금제를 추천해 드려요.</p></div>';
    out.innerHTML = opts.resultEl ? '' : EMPTY;

    function num(el) { var v = parseInt(String(el.value).replace(/[^0-9]/g, ''), 10); return isNaN(v) ? 0 : v; }
    function annual() { var v = num($('.f-sales')); return st.period === 'month' ? v * 12 : v; }
    function hint() {
      var v = num($('.f-sales'));
      $('.num-hint').textContent = v ? (st.period === 'month' ? '월 ' + eok(v) + ' → 연 ' + eok(v * 12) : '연 ' + eok(v)) : '';
    }
    Array.prototype.forEach.call(root.querySelectorAll('.seg'), function (g) {
      var name = g.getAttribute('data-name');
      Array.prototype.forEach.call(g.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false');
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(g.querySelectorAll('button'), function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          st[name] = b.getAttribute('data-v');
          if (name === 'staff') $('.staff-row').hidden = st.staff !== 'yes';
          if (name === 'period') hint();
          if (name === 'type') root.classList.toggle('is-corp', st.type === 'corp');
        });
      });
    });
    $('.f-sales').addEventListener('input', function (e) { var v = num(e.target); e.target.value = v ? comma(v) : ''; hint(); });
    ['.f-emp', '.f-free'].forEach(function (c) { $(c).addEventListener('input', function (e) { var v = num(e.target); e.target.value = v ? String(v) : ''; }); });

    function ind() { var sel = $('.f-ind'); return IND[sel.selectedIndex] || IND[IND.length - 1]; }
    function staffText() { return st.staff === 'yes' ? '4대보험 ' + num($('.f-emp')) + '명 · 프리랜서 ' + num($('.f-free')) + '명' : '없음'; }

    function calc() {
      var corp = st.type === 'corp', I = ind(), m = annual(), isNew = $('.f-new').checked;
      var err = $('.calc-err');
      if (!isNew && !m) {
        err.hidden = false; err.textContent = '작년 매출액을 넣어 주세요. 올해 처음 시작했다면 위의 ‘올해 새로 시작한 사업이에요’에 표시해 주세요.';
        $('.f-sales').setAttribute('aria-invalid', 'true');
        try { $('.f-sales').focus(); } catch (e) {}
        return null;
      }
      err.hidden = true; $('.f-sales').removeAttribute('aria-invalid');
      var emp = st.staff === 'yes' ? num($('.f-emp')) : 0;
      var book, plan, liteOk = false, b = null, add = 0;
      if (corp) { book = '복식부기(법인)'; plan = '법인 기장'; b = band(BANDS.corp[I[3]], m); }
      else {
        book = I[2] === 0 ? '복식부기 의무(전문직)' : isNew ? '간편장부 대상(신규)' : m >= I[2] ? '복식부기 의무' : '간편장부 대상';
        liteOk = book.indexOf('간편') === 0 && emp <= LITE_STAFF;
        if (liteOk) plan = '택스민 라이트';
        else { plan = '스탠다드 기장'; b = band(BANDS.personal[I[3]], m); }
      }
      if (b) {
        add = staffAdd(emp);
        if (emp > 20) b = { lo: b.lo, hi: 0, consult: true };
        b.lo += add; if (b.hi) b.hi += add;
      }
      var price = liteOk ? '월 ' + won(START.lite) : b.consult ? '월 ' + won(b.lo) + '부터' : '월 ' + man(b.lo) + '~' + won(b.hi);
      var reco = liteOk
        ? '사장님께는 <b>' + plan + '</b>를 추천해요. <span class="nw">' + price + '으로</span> 시작하실 수 있어요.' + (emp ? ' 인건비(원천세) 신고도 포함이에요.' : '')
        : (corp ? '대표님' : '사장님') + '께는 <b>' + plan + '</b>을 추천해요. 예상 금액은 <b class="nw">' + price + '</b>입니다.' + (b.consult ? ' 정확한 금액은 상담 때 정해 드려요.' : '');
      var sub = [];
      if (b && b.consult) sub.push('상담 후 확정');
      else if (b) sub.push('예상');
      if (add) sub.push('직원 ' + emp + '명 추가분 ' + won(add) + ' 포함');
      sub.push('부가세 별도');
      var data = {
        type: corp ? '법인사업자' : '개인사업자', industry: I[1],
        sales: isNew ? '올해 신규' + (m ? ' (' + eok(m) + ')' : '') : '연 ' + eok(m),
        salesMan: m, book: book, plan: plan, price: price, est: !liteOk, staff: staffText()
      };
      var rows = [['사업자', data.type], ['업종', data.industry], ['매출', data.sales], ['인건비 신고', data.staff]];
      out.innerHTML = '<div class="cr-card">' +
        '<div class="cr-top"><p class="cr-k">' + (corp ? '대표님' : '사장님') + ' 매출에 맞는 추천 요금제</p></div>' +
        '<h3>' + plan + '</h3>' +
        '<p class="cr-price"><b>' + price + '</b><span>' + sub.join(' · ') + '</span></p>' +
        '<p class="cr-reco">' + reco + '</p>' +
        '<dl class="cr-sum">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl>' +
        '<button class="btn btn-accent btn-block btn-lg cr-go" type="button">' + (opts.applyText || '이 내용으로 상담 신청하기') + ARROW + '</button>' +
        '<p class="cr-fine">정확한 금액은 담당 세무사가 자료를 보고 알려 드립니다.' + (corp ? '' : ' 종합소득세 신고(조정료)는 별도로 안내해 드려요.') + '</p>' +
        '</div>';
      out.classList.add('has');
      out.querySelector('.cr-go').addEventListener('click', function () {
        if (opts.onApply) opts.onApply(data);
        else if (window.TaxminApply) window.TaxminApply.open({ step: 'form', calc: data });
      });
      if (opts.onResult) opts.onResult(data);
      else if (opts.scrollTo) opts.scrollTo(out);
      else if (window.innerWidth < 960) { try { out.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }
      return data;
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); calc(); });
    $('.calc-reset').addEventListener('click', function () {
      form.reset(); st = { type: 'personal', period: 'year', staff: 'no' }; root.classList.remove('is-corp');
      Array.prototype.forEach.call(root.querySelectorAll('.seg'), function (g) {
        Array.prototype.forEach.call(g.querySelectorAll('button'), function (b, i) { b.classList.toggle('on', i === 0); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); });
      });
      $('.staff-row').hidden = true; $('.calc-err').hidden = true; hint();
      out.classList.remove('has'); out.innerHTML = opts.resultEl ? '' : EMPTY;
    });
    return { calc: calc };
  }

  window.TaxminFee = { mount: mount, IND: IND, START: START };
  Array.prototype.forEach.call(document.querySelectorAll('[data-fee-calc]'), function (el) { mount(el); });
})();
