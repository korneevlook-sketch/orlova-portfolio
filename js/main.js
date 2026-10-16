(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileMq = window.matchMedia('(max-width: 760px)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Звёзды на фоне ---------- */
  (function sky() {
    var c = $('#sky'); if (!c || !c.getContext) return;
    var ctx = c.getContext('2d'), stars = [], dpr = Math.min(window.devicePixelRatio || 1, 2), w, h, raf;
    function size() {
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      var n = Math.min(120, Math.round(w * h / 9000));
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + .3, p: Math.random() * 6.28, s: .15 + Math.random() * .35, d: Math.random() * .6 + .2 });
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var sy = window.scrollY || 0;
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var a = reduce ? .6 : .35 + .45 * (.5 + .5 * Math.sin(st.p + t / 1000 * st.s));
        var y = ((st.y * h - sy * st.d * .08) % h + h) % h;
        ctx.globalAlpha = a; ctx.fillStyle = '#E6E8FF';
        ctx.beginPath(); ctx.arc(st.x * w, y, st.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    var last = 0;
    function loop(t) { if (t - last > 66) { draw(t); last = t; } raf = requestAnimationFrame(loop); }
    size(); seed();
    if (reduce) { draw(0); window.addEventListener('scroll', function () { draw(0); }, { passive: true }); }
    else raf = requestAnimationFrame(loop);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); seed(); draw(0); }, 150); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else if (!reduce) raf = requestAnimationFrame(loop);
    });
  })();

  /* ---------- Шапка и меню ---------- */
  var header = $('.header'), burger = $('.burger'), nav = $('#nav');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }); });
  if ('IntersectionObserver' in window) {
    var links = {}; $$('a', nav).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && links[e.target.id]) { $$('a', nav).forEach(function (a) { a.classList.remove('is-active'); }); links[e.target.id].classList.add('is-active'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- Появление при прокрутке ---------- */
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { ro.observe(el); });
  } else $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });

  /* ---------- «Читать дальше» ---------- */
  function setupClamp() {
    $$('.clamp').forEach(function (el) {
      var body = $('.clamp__body', el), btn = $('.more-btn', el);
      if (el.dataset.open === '1') return;
      var isReview = el.classList.contains('review');
      var should = mobileMq.matches; // сворачиваем только на телефоне
      el.classList.remove('is-clamped', 'has-more');
      if (!should) return;
      el.classList.add('is-clamped');
      if (body.scrollHeight - body.clientHeight > 4) el.classList.add('has-more');
      else el.classList.remove('is-clamped');
      if (!btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', function () {
          el.dataset.open = '1'; el.classList.remove('is-clamped', 'has-more'); btn.setAttribute('aria-expanded', 'true');
        });
      }
      void isReview;
    });
  }
  setupClamp();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setupClamp);
  mobileMq.addEventListener ? mobileMq.addEventListener('change', setupClamp) : mobileMq.addListener(setupClamp);

  /* ---------- Созвездие ---------- */
  (function constellation() {
    var box = $('#constellation'); if (!box) return;
    var steps = $$('.c-step', box), NS = 'http://www.w3.org/2000/svg', svg, lines = [];
    function build() {
      if (svg) svg.remove();
      svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true');
      var b = box.getBoundingClientRect();
      var pts = steps.map(function (s) { var r = $('.c-star', s).getBoundingClientRect(); return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top]; });
      lines = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', pts[i][0]); l.setAttribute('y1', pts[i][1]); l.setAttribute('x2', pts[i + 1][0]); l.setAttribute('y2', pts[i + 1][1]);
        l.setAttribute('pathLength', '1'); l.setAttribute('class', 'c-line');
        l.style.transitionDelay = (reduce ? 0 : i * .32) + 's';
        svg.appendChild(l); lines.push(l);
      }
      box.insertBefore(svg, box.firstChild);
    }
    function light() {
      box.classList.add('is-drawn');
      steps.forEach(function (s, i) { setTimeout(function () { s.classList.add('is-on'); }, reduce ? 0 : i * 320); });
    }
    build();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var drawn = box.classList.contains('is-drawn'); build(); if (drawn) { lines.forEach(function (l) { l.style.transitionDelay = '0s'; }); } }, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    if ('IntersectionObserver' in window && !reduce) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { light(); o.disconnect(); } }, { threshold: .35 });
      o.observe(box);
    } else light();
  })();

  /* ---------- Чем могу помочь: звёзды загораются по очереди ---------- */
  (function helpStars() {
    var items = $$('.help-item'), art = $('#star-art'); if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduce) { items.forEach(function (i) { i.classList.add('is-lit'); }); if (art) art.classList.add('is-flare'); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-lit'); o.unobserve(e.target);
          if (e.target === items[items.length - 1] && art) art.classList.add('is-flare');
        }
      });
    }, { rootMargin: '0px 0px -30% 0px' });
    items.forEach(function (i) { o.observe(i); });
  })();

  /* ---------- Переключатель PR | Маркетинг ---------- */
  (function tabs() {
    var tabs = $$('.cases__tabs [role=tab]');
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (on) { p.hidden = false; p.classList.add('is-in'); } else p.hidden = true;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; select(n); n.focus(); }
      });
    });
    function sync() {
      if (mobileMq.matches) { var cur = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]; select(cur); }
      else $$('.cases__col').forEach(function (c) { c.hidden = false; });
    }
    sync();
    mobileMq.addEventListener ? mobileMq.addEventListener('change', sync) : mobileMq.addListener(sync);
    window.__selectCaseTab = function (panelId) {
      var tile = $('.case-tile[data-case="' + panelId + '"]'); if (!tile || !mobileMq.matches) return;
      var col = tile.closest('.cases__col');
      tabs.forEach(function (t) { if (t.getAttribute('aria-controls') === col.id) select(t); });
    };
  })();

  /* ---------- Панели кейсов ---------- */
  var openPanel = null, lastFocus = null;
  function focusables(el) { return $$('a[href],button:not([disabled]),video,[tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null; }); }
  function openCase(id, opts) {
    var p = document.getElementById(id); if (!p || !p.classList.contains('case-panel')) return;
    if (openPanel && openPanel !== p) closeCase(true);
    lastFocus = (opts && opts.from) || document.activeElement;
    p.removeAttribute('hidden');
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add('is-open'); }); });
    openPanel = p;
    var box = $('.case-panel__box', p); box.scrollTop = 0; box.focus({ preventScroll: true });
    $$('.case-tile[data-case="' + id + '"]').forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    var v = $('video[data-src]', p);
    if (v) { if (!v.src) v.src = (!v.canPlayType('video/mp4; codecs="avc1.4d401e"') && v.dataset.srcWebm) ? v.dataset.srcWebm : v.dataset.src; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    if (window.__selectCaseTab) window.__selectCaseTab(id);
  }
  function closeCase(silent) {
    var p = openPanel; if (!p) return;
    p.classList.remove('is-open');
    var v = $('video', p); if (v) v.pause();
    $$('.case-tile[data-case="' + p.id + '"]').forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    openPanel = null;
    setTimeout(function () { if (!p.classList.contains('is-open')) p.setAttribute('hidden', 'until-found'); }, reduce ? 0 : 360);
    document.body.classList.remove('is-locked');
    if (!silent) {
      history.replaceState(null, '', location.pathname + location.search + '#cases');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
  }
  $$('.case-tile').forEach(function (t) { t.addEventListener('click', function () { openCase(t.dataset.case, { from: t }); }); });
  $$('.case-panel').forEach(function (p) {
    $$('[data-close]', p).forEach(function (b) { b.addEventListener('click', function () { closeCase(); }); });
    // Поиск по странице находит текст кейса: открываем панель
    p.addEventListener('beforematch', function () { setTimeout(function () { openCase(p.id); }, 0); });
    // Свайп вниз на телефоне
    var box = $('.case-panel__box', p), sy = null, sx = null, dy = 0;
    box.addEventListener('touchstart', function (e) { if (box.scrollTop <= 0) { sy = e.touches[0].clientY; sx = e.touches[0].clientX; dy = 0; } else sy = null; }, { passive: true });
    box.addEventListener('touchmove', function (e) {
      if (sy === null) return; dy = e.touches[0].clientY - sy;
      var dx = Math.abs(e.touches[0].clientX - sx);
      if (dy > 0 && dy > dx) box.style.transform = 'translateY(' + Math.min(dy, 260) * .6 + 'px)';
    }, { passive: true });
    box.addEventListener('touchend', function () {
      box.style.transform = '';
      if (sy !== null && dy > 110) closeCase();
      sy = null;
    });
  });
  document.addEventListener('keydown', function (e) {
    if (!openPanel || !$('#lightbox').hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeCase(); }
    if (e.key === 'Tab') {
      var f = focusables(openPanel); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.case-panel__box', openPanel))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var p = id && document.getElementById(id);
    if (p && p.classList.contains('case-panel')) {
      var sec = document.getElementById('cases');
      if (sec) window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY - 70);
      openCase(id);
    } else if (openPanel) closeCase(true);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ---------- Лайтбокс ---------- */
  (function lightbox() {
    var lb = $('#lightbox'), img = $('#lb-img'), cap = $('#lb-cap'), cnt = $('#lb-count'), list = [], idx = 0, prevFocus;
    function itemsFor(btn) {
      if (btn.hasAttribute('data-gallery-single')) return [btn];
      var g = btn.closest('[data-gallery]'); return g ? $$('[data-full]', g) : [btn];
    }
    function show(i) {
      idx = (i + list.length) % list.length;
      var b = list[idx], im = $('img', b), fc = b.closest('figure') && $('figcaption', b.closest('figure'));
      img.src = b.dataset.full; img.alt = im ? im.alt : '';
      cap.textContent = b.dataset.caption || (fc ? fc.textContent : '') || (im ? im.alt : '');
      cnt.textContent = list.length > 1 ? (idx + 1) + ' / ' + list.length : '';
      $('.lb-prev', lb).hidden = $('.lb-next', lb).hidden = list.length < 2;
    }
    function open(btn) {
      list = itemsFor(btn); prevFocus = btn; show(list.indexOf(btn));
      lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('is-open'); });
      document.body.classList.add('is-locked'); $('.lb-close', lb).focus();
    }
    function close() {
      lb.classList.remove('is-open'); lb.hidden = true; img.removeAttribute('src');
      if (!openPanel) document.body.classList.remove('is-locked');
      if (prevFocus) prevFocus.focus({ preventScroll: true });
    }
    $$('[data-full]').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'Tab') { var f = $$('.lb-btn', lb).filter(function (x) { return !x.hidden; }); var k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); }
    }, true);
    var sx, sy;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
      else if (dy > 90) close();
    });
  })();

  /* ---------- Лента отзывов: точки ---------- */
  (function reviewDots() {
    var list = $('#reviews-list'), dots = $('#reviews-dots'); if (!list || !dots) return;
    var cards = $$('.review', list);
    cards.forEach(function () { dots.appendChild(document.createElement('span')); });
    var ds = $$('span', dots);
    function upd() {
      var c = list.scrollLeft + list.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function (card, i) { var m = card.offsetLeft + card.offsetWidth / 2, d = Math.abs(m - c); if (d < bd) { bd = d; best = i; } });
      ds.forEach(function (d, i) { d.classList.toggle('is-on', i === best); });
    }
    list.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true }); upd();
  })();

  /* ---------- Персональная звезда ---------- */
  (function finale() {
    var sec = $('#contact'); if (!sec || !sec.classList.contains('finale')) return;
    var stage = $('#stage'), star = $('#pstar'), skip = $('#stage-skip'), pills = $('#finale-pills');
    var beamsBox = $('#stage-beams'), winBox = $('#stage-windows'), coinBox = $('#stage-coins'), funnel = $('#funnel');
    var answer = $('#answer'), answerText = $('#answer-text'), card = $('#contact-card'), relight = $('#relight');
    var nodes = $$('.node', sec);
    var TEXT = {
      aware: 'Найду историю, которую захотят рассказать СМИ, выведу ваших экспертов на отраслевые площадки и подберу партнёров. О бренде начнут говорить те, кому вы нужны.',
      leads: 'Соберу каналы в одну воронку и посчитаю каждый инструмент. Внимание к бренду будет превращаться в заявки, а бюджет пойдёт только в то, что окупается.',
      trust: 'Покажу экспертизу вашей команды через выступления, публикации и понятный контент. Клиенты будут выбирать вас, потому что вам верят.',
      all: 'Начну с самой яркой звезды вашего продукта, построю вокруг неё воронку и каналы, а PR закрепит её в глазах клиентов. Узнаваемость, доверие и заявки будут работать вместе.'
    };
    var KEYS = { aware: ['smi', 'conf', 'partners'], leads: ['social', 'funnel'], trust: ['conf', 'content', 'smi'], all: [] };
    var state = 'armed', timers = [], rays = [], downs = [], wins = [], coins = [];

    function v() { var c = $('input[name=need]:checked', sec); return c ? c.value : 'all'; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    // окна в городе: детерминированный «случайный» набор
    var WIN_N = 28, seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < WIN_N; i++) {
      var w = document.createElement('span'); w.className = 'win';
      w.style.left = (3 + rnd() * 94).toFixed(2) + '%'; w.style.top = (52 + rnd() * 38).toFixed(2) + '%';
      winBox.appendChild(w); wins.push(w);
    }
    function center(el) { var r = el.getBoundingClientRect(), b = stage.getBoundingClientRect(); return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top]; }
    function beam(from, to, cls) {
      var d = document.createElement('span'), dx = to[0] - from[0], dy = to[1] - from[1];
      d.className = 'beam ' + (cls || ''); d.style.left = from[0] + 'px'; d.style.top = from[1] + 'px';
      d.style.width = Math.hypot(dx, dy) + 'px'; d.style.setProperty('--a', Math.atan2(dy, dx) + 'rad');
      beamsBox.appendChild(d); return d;
    }
    function layout() {
      var on = rays.map(function (r) { return r.classList.contains('is-on'); }), on2 = downs.map(function (r) { return r.classList.contains('is-on'); });
      beamsBox.textContent = ''; rays = []; downs = [];
      var sc = center($('.pstar__core', sec)), fr = funnel.getBoundingClientRect(), b = stage.getBoundingClientRect();
      var ftop = [fr.left + fr.width / 2 - b.left, fr.top - b.top + 4];
      nodes.forEach(function (n, i) {
        var nc = center($('.node__dot', n));
        rays.push(beam(sc, nc)); downs.push(beam(nc, ftop, 'beam--down'));
        if (on[i]) rays[i].classList.add('is-on'); if (on2[i]) downs[i].classList.add('is-on');
      });
      // монетки сыплются из горлышка воронки к линии города
      var spout = [fr.left + fr.width / 2 - b.left, fr.bottom - b.top];
      var cityTop = b.height * (mobileMq.matches ? .86 : .84);
      coinBox.textContent = ''; coins = [];
      var n = v() === 'leads' ? 9 : 5;
      for (var k = 0; k < n; k++) {
        var c = document.createElement('span'); c.className = 'coin';
        c.style.left = spout[0] + 'px'; c.style.top = spout[1] + 'px';
        c.style.setProperty('--dx', ((k % 2 ? 1 : -1) * (6 + (k * 7) % 22)) + 'px');
        c.style.setProperty('--fall', Math.max(40, cityTop - spout[1]) + 'px');
        c.style.setProperty('--d', (k * (n > 5 ? .13 : .2)).toFixed(2) + 's');
        coinBox.appendChild(c); coins.push(c);
      }
    }
    function applyVariant() {
      var val = v(); sec.dataset.v = val;
      nodes.forEach(function (n) { n.classList.toggle('is-key', KEYS[val].indexOf(n.dataset.n) > -1); });
      var lit = val === 'aware' ? WIN_N : 16;
      if (sec.classList.contains('s-city')) wins.forEach(function (w, i) { w.classList.toggle('is-on', i < lit); });
      answerText.textContent = TEXT[val];
    }
    function setRunning(r) { pills.disabled = r; skip.hidden = !r; sec.classList.toggle('is-running', r); }

    function finalFrame(instant) {
      clearTimers();
      if (instant) sec.classList.add('is-instant');
      sec.classList.add('s-flash', 's-city', 's-funnel', 's-coins');
      layout(); applyVariant();
      rays.concat(downs).forEach(function (r) { r.classList.add('is-on'); });
      nodes.forEach(function (n) { n.classList.add('is-on'); });
      coins.forEach(function (c) { c.style.animation = 'none'; });
      if (instant) { void sec.offsetWidth; sec.classList.remove('is-instant'); }
    }
    function showAnswer(withLanding) {
      setRunning(false); state = 'done';
      answer.classList.add('is-pre'); card.classList.add('is-pre');
      sec.classList.add('is-done');
      requestAnimationFrame(function () { requestAnimationFrame(function () { answer.classList.remove('is-pre'); }); });
      var reveal = function () {
        card.classList.remove('is-pre');
        if (!reduce) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.focus({ preventScroll: true });
      };
      if (!withLanding || reduce) { reveal(); return; }
      // звезда опускается и превращается в карточку контактов
      later(function () {
        var s = star.getBoundingClientRect(), c = card.getBoundingClientRect();
        star.style.transform = 'translate(' + (c.left + c.width / 2 - s.left - s.width / 2) + 'px,' + (c.top + 40 - s.top - s.height / 2) + 'px) scale(.35)';
        star.classList.add('is-landed');
        later(reveal, 450);
      }, 700);
    }
    function run() {
      state = 'running'; setRunning(true); applyVariant(); layout();
      // на телефоне показываем сцену целиком: звезда, созвездие, воронка и город в одном экране
      var sb = stage.getBoundingClientRect();
      if (sb.bottom > window.innerHeight) window.scrollBy({ top: sb.bottom - window.innerHeight + 8, behavior: 'smooth' });
      sec.classList.add('s-flash');                                   // 0–0,6 с: вспышка
      rays.forEach(function (r, i) { later(function () { rays[i].classList.add('is-on'); }, 600 + i * 230); });
      nodes.forEach(function (n, i) { later(function () { n.classList.add('is-on'); }, 900 + i * 230); });
      later(function () {                                              // 2–3 с: окна города
        sec.classList.add('s-city');
        var lit = v() === 'aware' ? WIN_N : 16;
        wins.slice(0, lit).forEach(function (w, i) { later(function () { w.classList.add('is-on'); }, i * (900 / lit)); });
      }, 2000);
      downs.forEach(function (r, i) { later(function () { downs[i].classList.add('is-on'); }, 3000 + i * 90); }); // 3–4,5 с: воронка
      later(function () { sec.classList.add('s-funnel'); }, 3200);
      later(function () { sec.classList.add('s-coins'); }, 3500);
      later(function () { showAnswer(true); }, 4800);
    }
    function skipNow() { if (state !== 'running') return; finalFrame(true); showAnswer(false); }
    function reset() {
      clearTimers(); state = 'armed'; setRunning(false);
      sec.classList.remove('is-done', 's-flash', 's-city', 's-funnel', 's-coins');
      star.classList.remove('is-landed'); star.style.transform = '';
      rays.concat(downs).forEach(function (r) { r.classList.remove('is-on'); });
      nodes.forEach(function (n) { n.classList.remove('is-on'); });
      wins.forEach(function (w) { w.classList.remove('is-on'); });
      coins.forEach(function (c) { c.style.animation = ''; });
      var t = $('#finale-title'); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      star.focus({ preventScroll: true });
    }

    star.addEventListener('click', function () {
      if (state === 'armed') { if (reduce) { finalFrame(true); showAnswer(false); } else run(); }
      else if (state === 'running') skipNow();
    });
    skip.addEventListener('click', skipNow);
    relight.addEventListener('click', reset);
    $$('input[name=need]', sec).forEach(function (r) { r.addEventListener('change', function () { applyVariant(); if (state === 'done') layout(); coins.forEach(function (c) { c.style.animation = 'none'; }); }); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (state !== 'armed') layout(); if (state === 'done') coins.forEach(function (c) { c.style.animation = 'none'; }); }, 150); });

    sec.classList.add('is-armed'); applyVariant();
    if (reduce) { finalFrame(true); state = 'done'; sec.classList.add('is-done'); }   // без движения: сразу финальный кадр
  })();

})();
