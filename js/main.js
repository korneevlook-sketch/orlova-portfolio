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
    var steps = $$('.step', box), wrap, lines = [], pts = [], linked = [];
    function build() {
      if (wrap) wrap.remove();
      wrap = document.createElement('div'); wrap.className = 'c-beams'; wrap.setAttribute('aria-hidden', 'true');
      var b = box.getBoundingClientRect();
      pts = steps.map(function (s) { var r = $('.step__star', s).getBoundingClientRect(); return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top]; });
      lines = []; linked = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var l = document.createElement('span'), dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
        linked[i] = Math.abs(dy) < 8 || Math.abs(dx) < 8;          // линия только внутри ряда (компьютер) или колонки (телефон)
        if (!linked[i]) continue;
        l.className = 'c-beam'; l.style.left = pts[i][0] + 'px'; l.style.top = pts[i][1] + 'px';
        l.style.width = Math.hypot(dx, dy) + 'px'; l.style.setProperty('--a', Math.atan2(dy, dx) + 'rad');
        l.style.transitionDelay = (i * .32) + 's';
        wrap.appendChild(l); lines.push(l);
      }
      box.insertBefore(wrap, box.firstChild);
    }
    // янтарный огонёк идёт от шага к шагу, по кругу, пока схема на экране
    var spark = document.createElement('span'), sparkI = 0, sparkT = null, visible = false;
    spark.className = 'c-spark'; spark.setAttribute('aria-hidden', 'true'); box.appendChild(spark);
    function place(i, animate) {
      spark.style.transition = animate ? 'transform .85s cubic-bezier(.45,0,.25,1), opacity .4s ease' : 'opacity .4s ease';
      spark.style.transform = 'translate(' + pts[i][0] + 'px,' + pts[i][1] + 'px)';
    }
    function hop() {
      if (!visible || !pts.length) { sparkT = null; return; }
      if (reduce || (sparkI < pts.length - 1 && !linked[sparkI])) {   // без движения или переход на новый ряд: гаснет и загорается на следующем шаге
        spark.classList.remove('is-on');
        sparkT = setTimeout(function () {
          sparkI = sparkI >= pts.length - 1 ? 0 : sparkI + 1; place(sparkI, false); spark.classList.add('is-on');
          sparkT = setTimeout(hop, 900);
        }, 500);
        return;
      }
      if (sparkI >= pts.length - 1) {                    // дошёл до «Внедрения»: гаснет и начинает снова
        spark.classList.remove('is-on');
        sparkT = setTimeout(function () { sparkI = 0; place(0, false); spark.classList.add('is-on'); sparkT = setTimeout(hop, 700); }, 1100);
        return;
      }
      sparkI++; place(sparkI, true);
      sparkT = setTimeout(hop, 1150);
    }
    function startSpark() {
      if (sparkT || !visible) return;
      place(sparkI, false); spark.classList.add('is-on'); sparkT = setTimeout(hop, 700);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && box.classList.contains('is-drawn')) startSpark();
        if (!visible) { clearTimeout(sparkT); sparkT = null; spark.classList.remove('is-on'); }
      }).observe(box);
    }
    function light() {
      box.classList.add('is-drawn');
      steps.forEach(function (s, i) { setTimeout(function () { s.classList.add('is-on'); }, i * 320); });
      setTimeout(startSpark, steps.length * 320 + 600);
    }
    build();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var drawn = box.classList.contains('is-drawn'); build(); if (pts[sparkI]) place(sparkI, false); if (drawn) { lines.forEach(function (l) { l.style.transitionDelay = '0s'; }); } }, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { light(); o.disconnect(); } }, { threshold: .2 });
      o.observe(box);
    } else light();
  })();

  /* ---------- Чем могу помочь: звёзды загораются по очереди ---------- */
  (function helpStars() {
    var items = $$('.help-item'), art = $('#star-art'); if (!items.length) return;
    if (!('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('is-lit'); }); if (art) art.classList.add('is-flare'); return; }
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

  /* ---------- Отзывы: карусель ---------- */
  (function reviewsCarousel() {
    var track = $('#rv-track'); if (!track) return;
    var cards = $$('.rv-card', track), dots = $('#rv-dots'), prev = $('#rv-prev'), next = $('#rv-next');
    cards.forEach(function (c, i) {
      var d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Отзыв ' + (i + 1));
      d.addEventListener('click', function () { go(i); }); dots.appendChild(d);
      var more = $('.rv-card__more', c), full = $('.rv-card__full', c);
      more.addEventListener('click', function () {
        var open = full.hidden; full.hidden = !open;
        more.setAttribute('aria-expanded', open); more.textContent = open ? 'Свернуть' : 'Читать полностью';
      });
    });
    var ds = $$('button', dots);
    function current() {
      var x = track.scrollLeft, best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft - track.offsetLeft - x); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function go(i) { i = Math.max(0, Math.min(cards.length - 1, i)); track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); }
    function upd() {
      var c = current(), end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      ds.forEach(function (d, i) { d.setAttribute('aria-current', i === c ? 'true' : 'false'); });
      prev.disabled = track.scrollLeft < 4; next.disabled = end;
    }
    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); } });
    track.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener('resize', upd); upd();
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
    var ACTIVE = {
      aware: ['social', 'talks', 'collab', 'wom', 'ugc', 'media'],
      leads: ['social', 'seo', 'wom', 'ugc', 'paid', 'collab'],
      trust: ['social', 'seo', 'talks', 'collab', 'wom', 'ugc', 'media'],
      all: ['social', 'seo', 'wom', 'ugc', 'paid', 'media', 'talks', 'collab']
    };
    var COINS = { aware: 4, trust: 5, all: 7, leads: 11 };
    var WINS = { aware: 30, trust: 18, all: 24, leads: 18 };
    var state = 'armed', timers = [], rays = [], drops = [], wins = [], coins = [];

    function v() { var c = $('input[name=need]:checked', sec); return c ? c.value : 'all'; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function isActive(n) { return ACTIVE[v()].indexOf(n.dataset.n) > -1; }

    // геометрия: звезда сверху по центру, 8 узлов по нижней полудуге, воронка под дугой, город внизу
    function geo() {
      var m = mobileMq.matches;
      return m
        ? { star: [50, 9], rx: 38, ry: 50, angles: [172, 152, 132, 112, 68, 48, 28, 8], fW: 30, fH: 12, city: 90 }
        : { star: [50, 14], rx: 41, ry: 40, angles: [168.75, 146.25, 123.75, 101.25, 78.75, 56.25, 33.75, 11.25], fW: 16, fH: 13, city: 89 };
    }
    var WIN_N = 30, seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < WIN_N; i++) {
      var w = document.createElement('span'); w.className = 'win';
      w.style.left = (3 + rnd() * 94).toFixed(2) + '%'; w.style.top = (52 + rnd() * 38).toFixed(2) + '%';
      winBox.appendChild(w); wins.push(w);
    }
    function beam(from, to, cls) {
      var d = document.createElement('span'), dx = to[0] - from[0], dy = to[1] - from[1];
      d.className = 'beam ' + (cls || ''); d.style.left = from[0] + 'px'; d.style.top = from[1] + 'px';
      d.style.width = Math.max(1, Math.hypot(dx, dy)) + 'px'; d.style.setProperty('--a', Math.atan2(dy, dx) + 'rad');
      beamsBox.appendChild(d); return d;
    }
    function layout() {
      var onR = rays.map(function (r) { return r.classList.contains('is-on'); });
      var onD = drops.map(function (r) { return r.classList.contains('is-on'); });
      var g = geo(), W = stage.clientWidth, H = stage.clientHeight;
      var px = function (p) { return [p[0] / 100 * W, p[1] / 100 * H]; };
      // узлы
      var pts = nodes.map(function (n, i) {
        var t = g.angles[i] * Math.PI / 180, x = g.star[0] + g.rx * Math.cos(t), y = g.star[1] + g.ry * Math.sin(t);
        n.style.left = x + '%'; n.style.top = y + '%'; return px([x, y]);
      });
      // подписи у краёв сдвигаем внутрь, чтобы не обрезались
      var sb = stage.getBoundingClientRect(), labBottom = [];
      nodes.forEach(function (n, i) {
        var lab = $('.node__label', n); lab.style.setProperty('--sh', '0px');
        var r = lab.getBoundingClientRect(), pad = 4, sh = 0;
        if (r.left < sb.left + pad) sh = sb.left + pad - r.left;
        if (r.right > sb.right - pad) sh = sb.right - pad - r.right;
        lab.style.setProperty('--sh', sh + 'px');
        labBottom.push(r.bottom - sb.top);
      });
      // общая линия сбора ниже самой нижней подписи, воронка сразу под ней
      var yc = Math.max.apply(null, labBottom) + 12, rimY = yc + 24, fTopPx = rimY - 3;
      funnel.style.left = (50 - g.fW / 2) + '%'; funnel.style.width = g.fW + '%';
      funnel.style.top = fTopPx + 'px'; funnel.style.height = g.fH + '%';
      beamsBox.textContent = ''; rays = []; drops = [];
      var sc = px(g.star);
      nodes.forEach(function (n, i) {
        rays.push(beam(sc, pts[i], isActive(n) ? '' : 'beam--dim'));
        if (onR[i]) rays[i].classList.add('is-on');
      });
      // вторая волна: активный узел → вниз до общей линии → к своей точке на краю воронки (порядок сохраняется, линии не пересекаются)
      var act = nodes.map(function (n, i) { return i; }).filter(function (i) { return isActive(nodes[i]); });
      var rimL = (50 - g.fW * .36) / 100 * W, rimR = (50 + g.fW * .36) / 100 * W;
      act.sort(function (p, q) { return pts[p][0] - pts[q][0]; }).forEach(function (i, k) {
        var rx = act.length > 1 ? rimL + (rimR - rimL) * k / (act.length - 1) : W / 2;
        var d1 = beam([pts[i][0], labBottom[i] + 4], [pts[i][0], yc], 'beam--down'), d2 = beam([pts[i][0], yc], [rx, rimY], 'beam--down');
        drops.push(d1, d2);
      });
      drops.forEach(function (d, k) { if (onD[k]) d.classList.add('is-on'); });
      // монетки из горлышка к линии города
      var throat = [W / 2, fTopPx + g.fH / 100 * H], cityY = g.city / 100 * H;
      coinBox.textContent = ''; coins = [];
      var n = COINS[v()];
      for (var k = 0; k < n; k++) {
        var c = document.createElement('span'); c.className = 'coin';
        c.style.left = throat[0] + 'px'; c.style.top = throat[1] + 'px';
        c.style.setProperty('--dx', ((k % 2 ? 1 : -1) * (4 + (k * 7) % 18)) + 'px');
        c.style.setProperty('--fall', Math.max(30, cityY - throat[1]) + 'px');
        c.style.setProperty('--d', (k * (n > 7 ? .11 : .18)).toFixed(2) + 's');
        coinBox.appendChild(c); coins.push(c);
      }
    }
    function applyVariant() {
      var val = v(); sec.dataset.v = val;
      nodes.forEach(function (n) { n.classList.toggle('is-active', isActive(n)); });
      if (sec.classList.contains('s-city')) wins.forEach(function (w, i) { w.classList.toggle('is-on', i < WINS[val]); });
      answerText.textContent = TEXT[val];
    }
    function setRunning(r) { pills.disabled = r; skip.hidden = !r; sec.classList.toggle('is-running', r); }
    function settle() { coins.forEach(function (c) { c.style.animation = 'none'; }); }

    function finalFrame(instant) {
      clearTimers();
      if (instant) sec.classList.add('is-instant');
      sec.classList.add('s-flash', 's-city', 's-funnel', 's-coins');
      applyVariant(); layout();
      rays.concat(drops).forEach(function (r) { r.classList.add('is-on'); });
      nodes.forEach(function (n) { n.classList.add('is-on', 'is-lit'); });
      settle();
      if (instant) { void sec.offsetWidth; sec.classList.remove('is-instant'); }
    }
    function showAnswer() {
      setRunning(false); state = 'done';
      answer.classList.add('is-pre'); card.classList.add('is-pre');
      sec.classList.add('is-done');
      requestAnimationFrame(function () { requestAnimationFrame(function () { answer.classList.remove('is-pre'); }); });
      later(function () {
        card.classList.remove('is-pre');
        card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        card.focus({ preventScroll: true });
      }, 600);
    }
    function run() {
      state = 'running'; setRunning(true); applyVariant(); layout();
      var sb = stage.getBoundingClientRect();
      if (sb.bottom > window.innerHeight) window.scrollBy({ top: sb.bottom - window.innerHeight + 8, behavior: reduce ? 'auto' : 'smooth' });
      sec.classList.add('s-flash');                                                    // 0–0,6 с: вспышка звезды
      nodes.forEach(function (n, i) {                                                  // 0,6–2,2 с: лучи к узлам по очереди
        later(function () { rays[i].classList.add('is-on'); }, 600 + i * 180);
        later(function () { n.classList.add('is-on'); }, 900 + i * 180);
      });
      nodes.filter(isActive).forEach(function (n, k) { later(function () { n.classList.add('is-lit'); }, 2350 + k * 70); }); // активные узлы загораются
      later(function () { sec.classList.add('s-funnel'); }, 2800);                    // линии к воронке
      drops.forEach(function (d, k) { later(function () { drops[k].classList.add('is-on'); }, 2900 + Math.floor(k / 2) * 80 + (k % 2) * 300); });
      later(function () {                                                              // окна в городе
        sec.classList.add('s-city');
        var lit = WINS[v()];
        wins.slice(0, lit).forEach(function (w, i) { later(function () { w.classList.add('is-on'); }, i * (800 / lit)); });
      }, 3700);
      later(function () { sec.classList.add('s-coins'); }, 4400);                     // монетки
      later(showAnswer, 6000);                                                         // ответ и карточка
    }
    function skipNow() { if (state !== 'running') return; finalFrame(true); showAnswer(); }
    function reset() {
      clearTimers(); state = 'armed'; setRunning(false);
      sec.classList.remove('is-done', 's-flash', 's-city', 's-funnel', 's-coins');
      rays.concat(drops).forEach(function (r) { r.classList.remove('is-on'); });
      nodes.forEach(function (n) { n.classList.remove('is-on', 'is-lit'); });
      wins.forEach(function (w) { w.classList.remove('is-on'); });
      coins.forEach(function (c) { c.style.animation = ''; });
      $('#finale-title').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      star.focus({ preventScroll: true });
    }

    star.addEventListener('click', function () {
      if (state === 'armed') run();
      else if (state === 'running') skipNow();
    });
    skip.addEventListener('click', skipNow);
    relight.addEventListener('click', reset);
    $$('input[name=need]', sec).forEach(function (r) {
      r.addEventListener('change', function () {
        applyVariant(); layout();
        if (state === 'done') { rays.concat(drops).forEach(function (x) { x.classList.add('is-on'); }); nodes.forEach(function (n) { n.classList.add('is-on', 'is-lit'); }); settle(); }
      });
    });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); if (state === 'done') settle(); }, 150); });

    sec.classList.add('is-armed'); applyVariant(); layout();
  })();

})();
