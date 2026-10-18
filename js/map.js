(function () {
  'use strict';
  var KEY = '';
  var box = document.getElementById('naver-map');
  if (!box) return;
  var lat = +box.getAttribute('data-lat'), lng = +box.getAttribute('data-lng'), name = box.getAttribute('data-name') || '';
  var done = false;
  function fail() { if (done) return; done = true; box.classList.add('map-off'); if (box.parentElement) box.parentElement.classList.add('no-map'); }
  if (!KEY) { fail(); return; }
  window.navermap_authFailure = function () { box.classList.remove('map-on'); done = false; fail(); };
  window.__tmMap = function () {
    try {
      var pos = new naver.maps.LatLng(lat, lng);
      var map = new naver.maps.Map(box.querySelector('.map-canvas'), {
        center: pos, zoom: 17, scrollWheel: false, pinchZoom: true,
        zoomControl: true, zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT, style: naver.maps.ZoomControlStyle.SMALL }
      });
      new naver.maps.Marker({
        position: pos, map: map, title: name,
        icon: { content: '<div class="map-pin"><i></i><span>' + name + '</span></div>', anchor: new naver.maps.Point(0, 0) }
      });
      done = true; box.classList.add('map-on');
    } catch (e) { fail(); }
  };
  var s = document.createElement('script');
  s.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' + encodeURIComponent(KEY) + '&callback=__tmMap';
  s.async = true;
  s.onerror = fail;
  document.head.appendChild(s);
  setTimeout(function () { if (!box.classList.contains('map-on')) fail(); }, 9000);
})();
