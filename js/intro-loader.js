(function () {
  var m = location.search.match(/[?&]intro=(\d{1,2})/), n = m && +m[1] >= 1 && +m[1] <= 27 ? m[1] : '24';
  if ([6, 7, 13, 16, 17, 22].indexOf(+n) >= 0) { var g = document.createElement('script'); g.src = 'js/intro-3d.js'; g.async = false; document.body.appendChild(g); }
  var s = document.createElement('script'); s.src = 'js/intros/intro' + n + '.js?v=fd5e7584'; s.async = false;

  if (n !== '24') s.onerror = function () { var f = document.createElement('script'); f.src = 'js/intros/intro24.js'; document.body.appendChild(f); };
  document.body.appendChild(s);
})();
