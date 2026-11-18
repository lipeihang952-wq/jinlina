/* =========================================================
 * 金丽娜 · 个人网站 v2 · 交互脚本
 * 依赖（均本地托管）：GSAP + ScrollTrigger、Lenis
 * 内容来自 assets/js/data.js
 * ========================================================= */
(() => {
  'use strict';

  const D = window.SITE_DATA;
  const root = document.documentElement;
  if (!D) { root.classList.remove('js'); return; }
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (!hasGSAP) root.classList.remove('js');
  else gsap.registerPlugin(ScrollTrigger);
  // 发布为 Claude 页面时：内容始终可见，动画只做位移，不先隐藏
  const ARTIFACT = !!window.JLN_ARTIFACT;

  /* ---------------- 工具 ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesktop = () => window.innerWidth >= 900;
  const attempt = (fn, fb = null) => { try { return fn(); } catch (e) { return fb; } };
  const store = {
    get: (k) => attempt(() => localStorage.getItem(k)),
    set: (k, v) => attempt(() => localStorage.setItem(k, v)),
    sget: (k) => attempt(() => sessionStorage.getItem(k)),
    sset: (k, v) => attempt(() => sessionStorage.setItem(k, v)),
  };
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const TYPES = { doc: '纪录片', film: '公益电影', book: '著作' };
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const fmtTitle = (w) => `《${w.title}》`;
  const yearOf = (w) => w.yearLabel || (w.year ? String(w.year) : '—');
  const today = () => { const d = new Date(); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
  const srcLinks = (ids) => (ids || []).map((id) => {
    const s = D.sources[id];
    return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.outlet)}${s.date ? ' ' + esc(s.date) : ''}</a>` : '';
  }).filter(Boolean).join('、');

  let toastT = 0;
  const toast = (msg) => {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2200);
  };

  /** 把一段文字拆成单字（保留给读屏软件的完整文本） */
  const splitChars = (el) => {
    if (!el) return [];
    const text = el.textContent;
    el.innerHTML = `<span class="sr-only">${esc(text)}</span>` +
      Array.from(text).map((ch) => (ch === ' ' ? ' ' : `<span class="ch" aria-hidden="true">${esc(ch)}</span>`)).join('');
    return $$('.ch', el);
  };

  /* ---------------- 声音（Web Audio 现场合成，无音频文件） ---------------- */
  let actx = null;
  let soundOn = store.get('jln-sound') !== 'off';
  const audio = () => {
    if (!soundOn) return null;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  };
  const clapSound = () => {
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = 0.14;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 5);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(1.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(170, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.13);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.7, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(og).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.18);
  };
  const tickSound = () => {
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 8);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(hp).connect(g).connect(ctx.destination);
    src.start(t);
  };

  /* =========================================================
   * 平滑滚动
   * ========================================================= */
  let lenis = null;
  function initSmooth() {
    if (!hasGSAP || reduce || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 1, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = (el) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.4, offset: 0 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  /* =========================================================
   * 导航 / 菜单 / 进度
   * ========================================================= */
  let menuOpen = false;
  function initNav() {
    const nav = $('#nav');
    const toggle = $('#navToggle');
    const menu = $('#menu');
    const setMenu = (on) => {
      menuOpen = on;
      menu.hidden = !on;
      toggle.setAttribute('aria-expanded', String(on));
      $('b', toggle).textContent = on ? '关闭' : '菜单';
      nav.classList.toggle('is-solid', on || nav.dataset.solid === '1');
      if (lenis) { if (on) lenis.stop(); else lenis.start(); }
      root.style.overflow = on ? 'hidden' : '';
      if (on && hasGSAP && !reduce) gsap.from($$('a', menu), { y: 40, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'expo.out' });
    };
    toggle.addEventListener('click', () => setMenu(!menuOpen));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      scrollToEl(target);
    });

    if (!hasGSAP) { nav.classList.add('is-solid'); return; }
    const bar = $('#progressBar');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        bar.style.transform = `scaleX(${self.progress})`;
        const y = self.scroll();
        nav.classList.toggle('is-hidden', !menuOpen && self.direction === 1 && y > window.innerHeight * 0.9);
        if (self.direction === -1) nav.classList.remove('is-hidden');
      },
    });
    ScrollTrigger.create({
      trigger: '#top', start: 'bottom top+=90',
      onEnter: () => { nav.dataset.solid = '1'; nav.classList.add('is-solid'); },
      onLeaveBack: () => { nav.dataset.solid = '0'; if (!menuOpen) nav.classList.remove('is-solid'); },
    });
    const links = $$('.nav-links a');
    links.forEach((a) => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: (self) => { if (self.isActive) links.forEach((x) => x.classList.toggle('is-active', x === a)); },
      });
    });
  }

  /* =========================================================
   * 自定义光标（仅鼠标设备）
   * ========================================================= */
  function initCursor() {
    if (!fine || reduce || !hasGSAP) return;
    root.classList.add('has-cursor');
    const c = $('#cursor');
    const dot = $('.cursor-dot', c);
    const ring = $('.cursor-ring', c);
    const label = $('#cursorLabel');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      c.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor], a, button, input, label');
      if (t && t.dataset.cursor) {
        label.textContent = t.dataset.cursor;
        c.classList.add('is-label');
        c.classList.remove('is-link');
      } else {
        c.classList.remove('is-label');
        c.classList.toggle('is-link', !!t && !t.matches('input'));
      }
    });
    document.addEventListener('pointerdown', () => c.classList.add('is-down'));
    document.addEventListener('pointerup', () => c.classList.remove('is-down'));
    document.documentElement.addEventListener('mouseleave', () => c.classList.remove('on'));
  }

  /* =========================================================
   * 片头 + 首屏
   * ========================================================= */
  function initLoader(onDone) {
    const el = $('#loader');
    if (!el) { onDone(); return; }
    if (!hasGSAP || reduce) { el.remove(); onDone(); return; }
    const seen = store.sget('jln2-seen');
    const minTime = seen ? 450 : 1500;
    const num = $('#ldNum');
    const counter = { v: 0 };
    gsap.to(counter, { v: 100, duration: minTime / 1000, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(counter.v); } });
    const img = $('.hp-bw');
    const imgReady = new Promise((res) => { if (!img || img.complete) res(); else { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); } });
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([Promise.race([Promise.all([imgReady, fontsReady]), wait(3000)]), wait(minTime)]).then(() => {
      store.sset('jln2-seen', '1');
      gsap.to(el, { yPercent: -100, duration: 1, ease: 'power4.inOut', onComplete: () => el.remove() });
      onDone();
    });
  }

  let darkroom = null;
  function heroIntro() {
    if (!hasGSAP || reduce) return;
    if (ARTIFACT) { setTimeout(() => darkroom && darkroom.demo(), 900); return; }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hn-c > span', { yPercent: 115, duration: 1.5, stagger: 0.1 }, 0.25)
      .from('.hp-frame', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5, clearProps: 'clipPath' }, 0.15)
      .from('.hp-frame img', { scale: 1.25, duration: 2 }, 0.15)
      .from('.hero-badge', { scale: 0, rotate: -120, duration: 1.4 }, 0.8)
      .from('.hero-meta, .hero-rec, .hero-scroll, .hp-hint', { y: 26, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.85)
      .add(() => darkroom && darkroom.demo(), 1.5);
  }

  function initHero() {
    const frame = $('#hpFrame');
    const hero = $('#top');
    if (!frame) return;

    // —— 暗房显影：鼠标/手指所到之处恢复彩色 ——
    const st = { r: 0, x: 50, y: 40 };
    let developed = false;
    let hovering = false;
    const apply = () => {
      frame.style.setProperty('--r', `${st.r}px`);
      frame.style.setProperty('--mx', `${st.x}%`);
      frame.style.setProperty('--my', `${st.y}%`);
    };
    const fullR = () => Math.hypot(frame.clientWidth, frame.clientHeight) * 1.15;
    const tweenTo = (vars, dur = 0.7) => {
      if (!hasGSAP) { Object.assign(st, vars); apply(); return; }
      gsap.to(st, { ...vars, duration: dur, ease: 'power3.out', onUpdate: apply, overwrite: 'auto' });
    };
    const posFrom = (e) => {
      const b = frame.getBoundingClientRect();
      st.x = clamp(((e.clientX - b.left) / b.width) * 100, 0, 100);
      st.y = clamp(((e.clientY - b.top) / b.height) * 100, 0, 100);
    };
    frame.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovering = true;
      posFrom(e);
      if (!developed) tweenTo({ r: Math.max(110, frame.clientWidth * 0.36) });
    });
    frame.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      posFrom(e);
      apply();
    });
    frame.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovering = false;
      if (!developed) tweenTo({ r: 0 }, 0.9);
    });
    frame.addEventListener('click', (e) => {
      posFrom(e);
      developed = !developed;
      tweenTo({ r: developed ? fullR() : (hovering ? 120 : 0) }, developed ? 1.4 : 0.9);
      toast(developed ? '照片已显影' : '回到黑白');
    });
    darkroom = {
      demo() {
        if (!hasGSAP || developed) return;
        const r0 = Math.max(90, frame.clientWidth * 0.3);
        gsap.timeline({ onUpdate: apply })
          .set(st, { x: 30, y: 30, r: 0 })
          .to(st, { r: r0, duration: 0.8, ease: 'power2.out' })
          .to(st, { x: 66, y: 46, duration: 1.4, ease: 'power1.inOut' })
          .to(st, { x: 46, y: 30, duration: 1, ease: 'power1.inOut' })
          .to(st, { r: 0, duration: 0.8, ease: 'power2.in' });
      },
    };

    // —— 实时时码（25 帧） ——
    const tcEl = $('#heroTc');
    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const loop = (t) => {
      if (t - last > 40) {
        const s = (t - t0) / 1000;
        tcEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s) % 60)}:${pad(Math.floor((s % 1) * 25))}`;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !raf) raf = requestAnimationFrame(loop);
      else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(hero);

    if (!hasGSAP || reduce) return;

    // —— 桌面：照片 3D 倾斜 + 名字视差 ——
    const mm = gsap.matchMedia();
    mm.add('(min-width: 821px) and (hover: hover)', () => {
      const name = $('.hero-name');
      gsap.set(name, { xPercent: -50, yPercent: -46, x: 0, y: 0 });
      const rX = gsap.quickTo(frame, 'rotationX', { duration: 0.9, ease: 'power3' });
      const rY = gsap.quickTo(frame, 'rotationY', { duration: 0.9, ease: 'power3' });
      const nX = gsap.quickTo(name, 'x', { duration: 1.3, ease: 'power3' });
      const nY = gsap.quickTo(name, 'y', { duration: 1.3, ease: 'power3' });
      gsap.set(frame, { transformPerspective: 900 });
      const move = (e) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        rX(-y * 10); rY(x * 14); nX(-x * 46); nY(-y * 26);
        frame.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
        frame.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
      };
      const leave = () => { rX(0); rY(0); nX(0); nY(0); };
      hero.addEventListener('pointermove', move);
      hero.addEventListener('pointerleave', leave);
      return () => {
        hero.removeEventListener('pointermove', move);
        hero.removeEventListener('pointerleave', leave);
        gsap.set(name, { clearProps: 'transform' });
      };
    });

    // —— 滚出首屏：照片缩小上移 ——
    gsap.to('.hero-photo', { yPercent: -10, scale: 0.92, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-meta, .hero-scroll', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '40% top', scrub: true } });
  }

  /* =========================================================
   * 滚动字幕带：速度跟随滚动
   * ========================================================= */
  function initMarquee() {
    const track = $('#mqTrack');
    if (!track) return;
    const unit = track.innerHTML;
    let html = unit;
    track.innerHTML = html;
    while (track.scrollWidth < window.innerWidth * 1.2 && html.length < unit.length * 8) { html += unit; track.innerHTML = html; }
    track.innerHTML = html + html;
    if (!hasGSAP || reduce) return;
    let half = track.scrollWidth / 2;
    let x = 0;
    let dir = -1;
    let speed = 1;
    addEventListener('resize', () => { half = track.scrollWidth / 2; });
    gsap.ticker.add(() => {
      x += dir * 0.7 * speed;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      speed += (1 - speed) * 0.04;
    });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const v = self.getVelocity();
        dir = v >= 0 ? -1 : 1;
        speed = Math.min(9, 1 + Math.abs(v) / 260);
      },
    });
  }

  /* =========================================================
   * 01 人物：逐字点亮 + 数字 + 视差
   * ========================================================= */
  function initIntro() {
    const chars = splitChars($('#introText'));
    if (hasGSAP && !reduce) {
      gsap.to(chars, { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: '#introText', start: 'top 82%', end: 'bottom 42%', scrub: 0.6 } });
      gsap.fromTo('.ip-img img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.ip-img', start: 'top bottom', end: 'bottom top', scrub: true } });
      $$('.count').forEach((el) => {
        const to = Number(el.dataset.to);
        const from = to > 1000 ? to - 26 : 0;
        const o = { v: from };
        el.textContent = from;
        ScrollTrigger.create({
          trigger: el, start: 'top 90%', once: true,
          onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }),
        });
      });
    }
    const ip = $('.ip-img');
    if (ip) ip.addEventListener('click', () => openLightboxByKey(ip.dataset.gallery));
  }

  /* =========================================================
   * 02 身份：手风琴
   * ========================================================= */
  function initRoles() {
    const panels = $$('.role-panel');
    const open = (p) => panels.forEach((x) => {
      const on = x === p;
      x.classList.toggle('is-open', on);
      x.setAttribute('aria-expanded', String(on));
    });
    panels.forEach((p) => {
      p.addEventListener('mouseenter', () => { if (fine && isDesktop()) open(p); });
      p.addEventListener('click', (e) => { if (!e.target.closest('a')) open(p); });
      p.addEventListener('focus', () => open(p));
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(p); } });
    });
  }

  /* =========================================================
   * 03 作品：横向胶片 + 详情弹窗
   * ========================================================= */
  const works = D.works;
  const poster = (w, cls) => {
    const im = w.img && D.images[w.img];
    return im
      ? `<img src="${esc(im.src)}" width="${im.w}" height="${im.h}" loading="lazy" decoding="async" alt="${esc(im.alt)}">`
      : `<span class="${cls}" aria-hidden="true">${esc(w.glyph || '')}</span>`;
  };
  function initWorks() {
    const track = $('#worksTrack');
    if (!track) return;
    track.innerHTML = works.map((w, i) => `
      <button type="button" class="frame" data-i="${i}" data-cursor="查看" style="--tone:${esc(w.tone || '#2a2420')}">
        <span class="frame-pic">${poster(w, 'frame-glyph')}<span class="frame-shade"></span></span>
        <span class="frame-year">${esc(w.year || '—')}</span>
        <span class="frame-type">${esc(TYPES[w.type])}</span>
        <span class="frame-title">${esc(fmtTitle(w))}</span>
        <span class="frame-meta">${esc([w.kind, w.role].filter(Boolean).join(' · '))}</span>
        ${w.awards.length ? `<span class="frame-award">★ ${esc(w.awards[0])}${w.awards.length > 1 ? ` 等 ${w.awards.length} 项` : ''}</span>` : ''}
      </button>`).join('');
    track.addEventListener('click', (e) => {
      const f = e.target.closest('.frame');
      if (f) openWork(Number(f.dataset.i));
    });

    const bar = $('#worksBar');
    const yearEl = $('#worksYear');
    const setProgress = (p) => {
      bar.style.transform = `scaleX(${p})`;
      const w = works[Math.min(works.length - 1, Math.floor(p * works.length))];
      yearEl.textContent = w.year || '—';
    };
    const vp = $('#worksViewport');
    vp.addEventListener('scroll', () => {
      if (vp.scrollWidth <= vp.clientWidth) return;
      setProgress(vp.scrollLeft / (vp.scrollWidth - vp.clientWidth));
    }, { passive: true });

    if (!hasGSAP || reduce) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#works', pin: '#worksPin', start: 'top top', end: () => `+=${dist()}`,
          scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => setProgress(self.progress),
        },
      });
      $$('.frame-pic > img, .frame-pic > .frame-glyph', track).forEach((el) => {
        gsap.fromTo(el, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: el.closest('.frame'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => gsap.set(track, { clearProps: 'transform' });
    });
  }

  const modal = $('#modal');
  let cur = 0;
  function fillWork(i) {
    cur = (i + works.length) % works.length;
    const w = works[cur];
    const im = w.img && D.images[w.img];
    const p = $('#mPoster');
    p.style.setProperty('--tone', w.tone || '#2a2420');
    p.innerHTML = (im ? `<img src="${esc(im.src)}" alt="${esc(im.alt)}">` : `<span class="mp-glyph" aria-hidden="true">${esc(w.glyph || '')}</span>`) +
      `<span class="mp-year">${esc(w.year || '—')}</span>`;
    $('#mK').textContent = `${TYPES[w.type]} · ${yearOf(w)}`;
    $('#mTitle').textContent = fmtTitle(w);
    $('#mMeta').textContent = [w.kind, w.role, w.platform].filter(Boolean).join(' · ');
    $('#mText').innerHTML = `<p>${esc(w.summary)}</p>${w.detail ? `<p>${esc(w.detail)}</p>` : ''}`;
    $('#mAwards').innerHTML = (w.awards || []).map((a) => `<span>★ ${esc(a)}</span>`).join('');
    $('#mSrc').innerHTML = `出处：${srcLinks(w.src)}`;
    $('#mCount').textContent = `${pad(cur + 1)} / ${pad(works.length)}`;
    const body = $('.m-body', modal);
    body.classList.remove('swap');
    void body.offsetWidth;
    body.classList.add('swap');
    body.scrollTop = 0;
  }
  function openWork(i) {
    if (!modal) return;
    fillWork(i);
    if (!modal.open) {
      if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
      if (lenis) lenis.stop();
      root.classList.remove('has-cursor');
    }
  }
  function initModal() {
    if (!modal) return;
    const close = () => { if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open'); };
    modal.addEventListener('close', () => {
      if (lenis) lenis.start();
      if (fine && !reduce && hasGSAP) root.classList.add('has-cursor');
    });
    $('#mClose').addEventListener('click', close);
    $('#mPrev').addEventListener('click', () => fillWork(cur - 1));
    $('#mNext').addEventListener('click', () => fillWork(cur + 1));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') fillWork(cur - 1);
      else if (e.key === 'ArrowRight') fillWork(cur + 1);
    });
  }

  /* =========================================================
   * 04 现场：雪夜地图 + 滚动叙事 + 风雪
   * ========================================================= */
  function initField() {
    const box = $('#fieldMap');
    const list = $('#fieldNotes');
    if (!box || !list) return;
    const R = D.route;
    const W = 1000;
    const H = 700;
    const P = (lon, lat) => [40 + (lon - 99) * 42.42, 30 + (49 - lat) * 58];
    const pts = R.stations.map((s) => ({ ...s, xy: P(s.lon, s.lat) }));
    const f1 = (n) => n.toFixed(1);
    let grat = '<g class="grat">';
    for (let lon = 100; lon <= 120; lon += 5) { const [gx] = P(lon, 49); grat += `<line x1="${f1(gx)}" y1="0" x2="${f1(gx)}" y2="${H}"/><text x="${f1(gx + 6)}" y="${H - 14}">${lon}°E</text>`; }
    for (let lat = 38; lat <= 48; lat += 2) { const [, gy] = P(99, lat); grat += `<line x1="0" y1="${f1(gy)}" x2="${W}" y2="${f1(gy)}"/><text x="10" y="${f1(gy - 7)}">${lat}°N</text>`; }
    grat += '</g>';
    const d = pts.map((p, k) => `${k ? 'L' : 'M'}${f1(p.xy[0])} ${f1(p.xy[1])}`).join(' ');
    const [rx, ry] = P(R.ref.lon, R.ref.lat);
    const km200 = (42.42 * 200) / 81.4;
    box.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="《走边关》内蒙古段路线示意：黑水城、阿拉善、巴彦淖尔、包头、锡林浩特、阿尔山，自西向东">
        ${grat}
        <path class="route-bg" d="${d}"/>
        <path class="route" d="${d}"/>
        <g class="refpt" transform="translate(${f1(rx)} ${f1(ry)})"><path d="M0 -9 L2.6 -2.8 9 -2.8 3.9 1.2 5.6 7.6 0 3.8 -5.6 7.6 -3.9 1.2 -9 -2.8 -2.6 -2.8Z"/></g>
        ${pts.map((p) => `<g class="stn" transform="translate(${f1(p.xy[0])} ${f1(p.xy[1])})"><circle class="pulse" r="9"/><circle class="dot" r="9"/></g>`).join('')}
        <g class="scalebar" transform="translate(40 ${H - 56})"><path d="M0 0 V8 H${f1(km200)} V0"/><text x="0" y="-8">0</text><text x="${f1(km200 - 34)}" y="-8">200 km</text></g>
        <g class="compass" transform="translate(${W - 52} ${H - 70})"><path d="M0 -28 L8 0 L0 28 L-8 0Z" opacity=".35"/><path d="M0 -28 L8 0 L-8 0Z"/><text x="0" y="-36" text-anchor="middle">N</text></g>
      </svg>
      <div class="map-labels">
        <p class="map-title">走边关 · 内蒙古段<b>自西向东 →</b></p>
        <span class="ref-label" style="left:${(rx / W) * 100}%;top:${(ry / H) * 100}%">北京</span>
        ${pts.map((p, k) => `<button type="button" class="stn-label lp-${p.lp}" data-i="${k}" data-cursor="去这站" style="left:${(p.xy[0] / W) * 100}%;top:${(p.xy[1] / H) * 100}%"><b>${k + 1}</b>${esc(p.name)}</button>`).join('')}
      </div>`;

    const route = $('.route', box);
    const total = route.getTotalLength();
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum[k] = cum[k - 1] + Math.hypot(pts[k].xy[0] - pts[k - 1].xy[0], pts[k].xy[1] - pts[k - 1].xy[1]);
    route.style.strokeDasharray = `${total}`;
    route.style.strokeDashoffset = `${total}`;

    list.innerHTML = R.notes.map((n, k) => `
      <li class="note" data-station="${esc(n.station)}">
        <span class="note-idx" aria-hidden="true">${pad(k + 1)}</span>
        <p class="note-date">${esc(n.date)}</p>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.text)}</p>
        <span class="src-line">出处：${srcLinks(n.src)}</span>
      </li>`).join('');
    const notes = $$('.note', list);
    const stn = $$('.stn', box);
    const lbl = $$('.stn-label', box);
    const idxOf = (id) => pts.findIndex((p) => p.id === id);
    const activate = (i) => {
      route.style.strokeDashoffset = `${total - cum[i]}`;
      stn.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('visited', k < i); });
      lbl.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('visited', k < i); });
    };
    const setNote = (n) => { notes.forEach((x) => x.classList.toggle('on', x === n)); activate(idxOf(n.dataset.station)); };
    if (hasGSAP) {
      notes.forEach((n) => ScrollTrigger.create({
        trigger: n, start: () => (isDesktop() ? 'top 58%' : 'top 70%'), end: () => (isDesktop() ? 'bottom 42%' : 'bottom 55%'),
        onToggle: (self) => { if (self.isActive) setNote(n); },
      }));
    } else {
      notes.forEach((n) => n.classList.add('on'));
      activate(pts.length - 1);
    }
    lbl.forEach((b) => b.addEventListener('click', () => {
      const id = pts[Number(b.dataset.i)].id;
      const n = notes.find((x) => x.dataset.station === id);
      if (n) {
        if (lenis) lenis.scrollTo(n, { offset: -window.innerHeight * 0.3, duration: 1.2 });
        else n.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
      activate(Number(b.dataset.i));
    }));

    initSnow();
  }

  function initSnow() {
    const cv = $('#snow');
    const sec = $('#field');
    if (!cv || !sec || reduce) return;
    const ctx = cv.getContext('2d');
    let w = 0;
    let h = 0;
    let flakes = [];
    let wind = 0;
    let target = 0;
    let raf = 0;
    const make = (anywhere) => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : -10,
      r: Math.random() * 2.2 + 0.6, s: Math.random() * 0.8 + 0.35, o: Math.random() * 0.6 + 0.25, p: Math.random() * Math.PI * 2,
    });
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp((w * h) / 7000, 60, 240));
      flakes = Array.from({ length: n }, () => make(true));
    };
    const tick = () => {
      wind += (target - wind) * 0.02;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (const f of flakes) {
        f.p += 0.01;
        f.y += f.s * (1 + f.r * 0.35);
        f.x += wind * (0.6 + f.r * 0.4) + Math.sin(f.p) * 0.35;
        if (f.y > h + 10) Object.assign(f, make(false));
        if (f.x > w + 10) f.x = -10;
        if (f.x < -10) f.x = w + 10;
        ctx.globalAlpha = f.o;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    sec.addEventListener('pointermove', (e) => { target = (e.clientX / window.innerWidth - 0.5) * 4; });
    sec.addEventListener('pointerleave', () => { target = 0; });
    addEventListener('resize', () => { if (raf) resize(); });
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !raf) { resize(); raf = requestAnimationFrame(tick); }
      else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(sec);
  }

  /* =========================================================
   * 05 打一板
   * ========================================================= */
  function initSlate() {
    const facts = D.slate;
    const clapper = $('#clapper');
    if (!clapper) return;
    const stick = $('#clapStick');
    const collect = $('#slateCollect');
    const countEl = $('#slateCount');
    const card = $('#slateCard');
    const kEl = $('#scK');
    const tEl = $('#scText');
    const sEl = $('#scSrc');
    const sec = $('#slate');
    const soundBtn = $('#soundToggle');
    collect.innerHTML = facts.map(() => '<span></span>').join('');
    const cells = $$('span', collect);
    $('#cbDate').textContent = today();
    const got = new Set();
    let idx = -1;
    let takes = 0;
    let busy = false;
    let typing = 0;

    const setSound = (on) => {
      soundOn = on;
      store.set('jln-sound', on ? 'on' : 'off');
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.textContent = on ? '声音 · 开' : '声音 · 关';
    };
    setSound(soundOn);
    soundBtn.addEventListener('click', () => setSound(!soundOn));

    const typeText = (text) => {
      clearInterval(typing);
      if (reduce) { tEl.textContent = text; return; }
      const chars = Array.from(text);
      let i = 0;
      tEl.textContent = '';
      typing = setInterval(() => {
        i += 1;
        tEl.textContent = chars.slice(0, i).join('');
        if (i >= chars.length) clearInterval(typing);
      }, 26);
    };

    const show = () => {
      const f = facts[idx];
      $('#cbScene').textContent = pad(idx + 1);
      $('#cbShot').textContent = pad(((idx * 7) % 23) + 1);
      $('#cbTake').textContent = String(takes);
      kEl.textContent = `第 ${pad(idx + 1)} 场 · ${f.scene}`;
      typeText(f.text);
      sEl.innerHTML = `出处：${srcLinks(f.src)}`;
      cells.forEach((c, k) => { c.classList.toggle('got', got.has(k)); c.classList.toggle('now', k === idx); });
      countEl.textContent = String(got.size);
      if (got.size === facts.length && !sec.classList.contains('complete')) {
        sec.classList.add('complete');
        setTimeout(() => toast('14 个故事全部解锁，谢谢你看完她的故事'), 900);
        if (hasGSAP && !reduce) gsap.fromTo(cells, { y: 0 }, { y: -14, duration: 0.35, stagger: 0.04, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
    };

    const clap = () => {
      if (busy) return;
      busy = true;
      takes += 1;
      idx = (idx + 1) % facts.length;
      got.add(idx);
      const done = () => { busy = false; };
      if (hasGSAP && !reduce) {
        gsap.timeline({ onComplete: done })
          .to(stick, { rotate: 0, duration: 0.11, ease: 'power4.in' })
          .add(() => {
            clapSound();
            clapper.classList.remove('shake');
            void clapper.offsetWidth;
            clapper.classList.add('shake');
            show();
            gsap.fromTo(card, { y: 14, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
          })
          .to(stick, { rotate: -16, duration: 0.7, ease: 'elastic.out(1, .45)', delay: 0.12 });
      } else {
        clapSound();
        show();
        done();
      }
    };
    clapper.addEventListener('click', clap);
  }

  /* =========================================================
   * 06 文字：3D 书 + 目录 + 明信片
   * ========================================================= */
  function initBook() {
    const toc = $('#toc');
    if (toc) toc.innerHTML = D.toc.map((t, k) => `<li class="${k === D.toc.length - 1 ? 'hl' : ''}"><span>第${CN[k]}章</span>${esc(t)}</li>`).join('');
    $$('.ob').forEach((b) => b.addEventListener('click', () => openWork(works.findIndex((w) => w.id === b.dataset.work))));

    const stage = $('#bookStage');
    const book = $('#book3d');
    if (!stage || !book) return;
    let rx = -8;
    let ry = -30;
    let vx = 0;
    let vy = 0;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    let raf = 0;
    let idle = 0;
    const set = () => { book.style.setProperty('--rx', `${rx}deg`); book.style.setProperty('--ry', `${ry}deg`); };
    stage.addEventListener('pointerdown', (e) => {
      dragging = true; lx = e.clientX; ly = e.clientY; vx = 0; vy = 0;
      attempt(() => stage.setPointerCapture(e.pointerId));
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      ry += dx * 0.6;
      rx = clamp(rx - dy * 0.4, -32, 32);
      vx = dx * 0.6; vy = -dy * 0.4;
      set();
    });
    const end = () => { dragging = false; idle = performance.now(); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    const loop = (t) => {
      if (!dragging) {
        ry += vx; rx = clamp(rx + vy, -32, 32);
        vx *= 0.95; vy *= 0.9;
        if (Math.abs(vx) < 0.03 && !reduce && t - idle > 1800) {
          ry += Math.sin(t / 1400) * 0.12;
          rx += (-8 - rx) * 0.01;
        }
        set();
      }
      raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !raf) raf = requestAnimationFrame(loop);
      else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(stage);
  }

  function initPostcard() {
    const grid = $('#pcGrid');
    const input = $('#pcInput');
    const nameIn = $('#pcName');
    if (!grid || !input) return;
    const MAX = 40;
    const cols = () => (window.innerWidth <= 760 ? 10 : 20);
    const render = (fresh = -1) => {
      const chars = Array.from(input.value).slice(0, MAX);
      const c = cols();
      const cells = Math.ceil(MAX / c) * c;
      grid.style.setProperty('--cols', String(c));
      let html = '';
      for (let i = 0; i < cells; i++) {
        html += `<span class="pc-cell${i === fresh ? ' new' : ''}${i === chars.length && document.activeElement === input ? ' caret' : ''}">${esc(chars[i] || '')}</span>`;
      }
      grid.innerHTML = html;
    };
    let composing = false;
    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; render(Array.from(input.value).length - 1); tickSound(); });
    input.addEventListener('input', (e) => {
      if (composing || e.isComposing) return;
      render(Array.from(input.value).length - 1);
      tickSound();
    });
    input.addEventListener('focus', () => render());
    input.addEventListener('blur', () => render());
    $('#pcPaper').addEventListener('click', () => input.focus());
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => render(), 150); });
    render();

    $('#pcMake').addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) { toast('先写一句话吧'); input.focus(); return; }
      const name = nameIn.value.trim();
      if (document.fonts && document.fonts.load) {
        await attempt(() => Promise.all([
          document.fonts.load('900 56px "JLN Serif"'), document.fonts.load('500 40px "JLN Serif"'),
          document.fonts.load('italic 34px "Instrument Serif"'), document.fonts.load('60px "JLN Brush"'),
        ]), null);
      }
      const url = drawCard(Array.from(text).slice(0, MAX), name);
      const res = $('#pcResult');
      $('#pcImg').src = url;
      const dl = $('#pcDownload');
      if (dl) dl.href = url;
      res.hidden = false;
      clapSound();
      if (hasGSAP && !reduce) gsap.from(res, { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out' });
      setTimeout(() => res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }), 50);
    });
  }

  function drawCard(chars, name) {
    const cv = $('#pcCanvas');
    const ctx = cv.getContext('2d');
    const W = cv.width;
    const H = cv.height;
    const serif = '"JLN Serif", "Noto Serif SC", "Songti SC", "STSong", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fbf6ec';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = `rgba(120,90,60,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
    }
    ctx.strokeStyle = '#c9a063';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.lineWidth = 1;
    ctx.strokeRect(54, 54, W - 108, H - 108);

    ctx.fillStyle = '#1a1611';
    ctx.font = `900 64px ${serif}`;
    ctx.fillText('写给 金丽娜', 120, 190);
    ctx.fillStyle = '#8a7f70';
    ctx.font = 'italic 38px "Instrument Serif", Georgia, serif';
    ctx.fillText('A note for Jin Lina', 122, 244);

    // 邮票 + 邮戳
    const sx = W - 300;
    const sy = 110;
    ctx.save();
    ctx.translate(sx + 90, sy + 110);
    ctx.rotate(-0.05);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-92, -112, 184, 224);
    ctx.strokeStyle = '#d24b35';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(-84, -104, 168, 208);
    ctx.setLineDash([]);
    ctx.fillStyle = '#d24b35';
    ctx.font = '96px "JLN Brush", "STXingkai", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('金', 0, 10);
    ctx.font = `500 22px ${serif}`;
    ctx.fillText('纪录片导演', 0, 72);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(26,22,17,.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sx - 30, sy + 150, 74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `500 20px ${serif}`;
    ctx.fillStyle = 'rgba(26,22,17,.45)';
    ctx.textAlign = 'center';
    ctx.fillText(today(), sx - 30, sy + 157);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      for (let x = 0; x <= 240; x += 8) {
        const y = sy + 112 + k * 26 + Math.sin(x / 18) * 6;
        if (x === 0) ctx.moveTo(sx + 50 + x - 330, y); else ctx.lineTo(sx + 50 + x - 330, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 稿纸格
    const c = 20;
    const rows = 2;
    const cell = 58;
    const gap = 18;
    const gx = (W - c * cell) / 2;
    const gy = 400;
    ctx.strokeStyle = 'rgba(210,75,53,.55)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < c; k++) ctx.strokeRect(gx + k * cell, gy + r * (cell + gap), cell, cell);
    }
    ctx.fillStyle = '#1a1611';
    ctx.font = `500 40px ${serif}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chars.forEach((ch, i) => {
      const r = Math.floor(i / c);
      const k = i % c;
      ctx.fillText(ch, gx + k * cell + cell / 2, gy + r * (cell + gap) + cell / 2 + 2);
    });

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1a1611';
    ctx.font = `500 38px ${serif}`;
    ctx.fillText(`—— ${name || '一位观众'}`, W - 120, H - 200);
    ctx.fillStyle = '#8a7f70';
    ctx.font = 'italic 32px "Instrument Serif", Georgia, serif';
    ctx.fillText(today(), W - 120, H - 150);
    ctx.textAlign = 'left';
    ctx.font = `500 24px ${serif}`;
    ctx.fillText('金丽娜 · 纪录片导演 · 记者 · 作家', 120, H - 130);
    return cv.toDataURL('image/png');
  }

  /* =========================================================
   * 07 荣誉
   * ========================================================= */
  function initHonors() {
    const names = [];
    works.forEach((w) => w.awards.forEach((a) => names.push(a)));
    const half = Math.ceil(names.length / 2);
    const row = (arr) => {
      const unit = arr.map((n) => `<span>${esc(n)}</span><i>✦</i>`).join('');
      return unit + unit;
    };
    $('#hmRow1').innerHTML = row(names.slice(0, half));
    $('#hmRow2').innerHTML = row(names.slice(half));

    $('#titles').innerHTML = D.titles.map((t) => `
      <div class="title-item" data-anim>
        <div class="ti-big">${esc(t.big)}<small>${esc(t.unit)}</small></div>
        <h4>${esc(t.title)}</h4>
        <p>${esc(t.text)}</p>
      </div>`).join('');

    const rows = [];
    works.forEach((w, i) => w.awards.forEach((a) => rows.push({ year: w.year, a, w, i })));
    rows.sort((x, y) => x.year - y.year);
    const list = $('#awardList');
    list.innerHTML = rows.map((r) => `
      <li class="award-row" tabindex="0" data-i="${r.i}" data-cursor="查看" data-anim>
        <span class="ar-year">${r.year}</span>
        <span class="ar-name">${esc(r.a)}</span>
        <span class="ar-work">${esc(fmtTitle(r.w))}</span>
        <span class="ar-arrow" aria-hidden="true">→</span>
      </li>`).join('');
    list.addEventListener('click', (e) => { const li = e.target.closest('.award-row'); if (li) openWork(Number(li.dataset.i)); });
    list.addEventListener('keydown', (e) => {
      const li = e.target.closest('.award-row');
      if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openWork(Number(li.dataset.i)); }
    });
  }

  function initQuote() {
    const chars = splitChars($('#quoteText'));
    if (hasGSAP && !reduce) {
      gsap.to(chars, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top 70%', end: 'center 45%', scrub: 0.6 } });
    }
  }

  /* =========================================================
   * 08 影像 + 看大图
   * ========================================================= */
  const gal = D.gallery.filter((k) => D.images[k]);
  let lbIdx = 0;
  function openLightbox(i) {
    const lb = $('#lightbox');
    lbIdx = (i + gal.length) % gal.length;
    const im = D.images[gal[lbIdx]];
    $('#lbImg').src = im.src;
    $('#lbImg').alt = im.alt;
    $('#lbCap').textContent = `${im.caption}　${im.credit}`;
    if (lb.hidden) {
      lb.hidden = false;
      if (lenis) lenis.stop();
      root.style.overflow = 'hidden';
      if (hasGSAP && !reduce) gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      $('#lbClose').focus({ preventScroll: true });
    }
    if (hasGSAP && !reduce) gsap.fromTo('#lbImg', { scale: 0.96, opacity: 0.3 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' });
  }
  function openLightboxByKey(key) {
    const i = gal.indexOf(key);
    if (i >= 0) openLightbox(i);
  }
  function initGallery() {
    const grid = $('#galGrid');
    if (!grid) return;
    grid.innerHTML = gal.map((k, i) => {
      const im = D.images[k];
      return `<figure class="gal-item" tabindex="0" data-i="${i}" data-cursor="放大" data-anim>
        <img src="${esc(im.src)}" width="${im.w}" height="${im.h}" loading="lazy" decoding="async" alt="${esc(im.alt)}">
        <figcaption>${esc(im.caption)}<span>${esc(im.credit)}</span></figcaption></figure>`;
    }).join('');
    grid.addEventListener('click', (e) => { const f = e.target.closest('.gal-item'); if (f) openLightbox(Number(f.dataset.i)); });
    grid.addEventListener('keydown', (e) => {
      const f = e.target.closest('.gal-item');
      if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLightbox(Number(f.dataset.i)); }
    });

    const lb = $('#lightbox');
    const close = () => {
      lb.hidden = true;
      if (lenis) lenis.start();
      root.style.overflow = '';
    };
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => openLightbox(lbIdx - 1));
    $('#lbNext').addEventListener('click', () => openLightbox(lbIdx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') openLightbox(lbIdx - 1);
      else if (e.key === 'ArrowRight') openLightbox(lbIdx + 1);
    });
    let sx = 0;
    lb.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    lb.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 50 && e.pointerType !== 'mouse') openLightbox(lbIdx + (dx < 0 ? 1 : -1));
    });
  }

  /* =========================================================
   * 09 出处 + 页脚
   * ========================================================= */
  function initSources() {
    const ul = $('#srcList');
    if (!ul) return;
    ul.innerHTML = Object.keys(D.sources).map((id) => {
      const s = D.sources[id];
      return `<li data-anim><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">
        <span class="sl-date">${esc(s.date || '—')}</span><span class="sl-outlet">${esc(s.outlet)}</span>
        <span class="sl-title">${esc(s.title)}</span><span class="sl-go" aria-hidden="true">↗</span></a></li>`;
    }).join('');

    const email = ((D.config && D.config.contactEmail) || '').trim();
    const box = $('#ftContact');
    if (email && box) {
      box.hidden = false;
      box.innerHTML = `<a class="btn btn-gold" href="mailto:${esc(email)}">合作联系 · ${esc(email)}</a>`;
    }
  }

  /* =========================================================
   * 进场动画
   * ========================================================= */
  function initReveals() {
    if (!hasGSAP || reduce) { $$('[data-anim]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; }); return; }
    const fade = ARTIFACT ? {} : { opacity: 0 };
    ScrollTrigger.batch('[data-anim]', {
      start: 'top 90%', once: true,
      onEnter: (batch) => (ARTIFACT
        ? gsap.from(batch, { y: 28, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true })
        : gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true })),
    });
    gsap.from('.ft-big', { yPercent: 35, ...fade, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });
    gsap.from('.frame', { y: 60, ...fade, duration: 1.1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '#works', start: 'top 75%' } });
    gsap.from('.role-panel', { y: 70, ...fade, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#rolesPanels', start: 'top 85%' } });
  }

  /* ---------------- 启动 ---------------- */
  const run = (name, fn) => { try { fn(); } catch (err) { console.error(`[${name}]`, err); } };
  run('smooth', initSmooth);
  run('nav', initNav);
  run('cursor', initCursor);
  run('hero', initHero);
  run('marquee', initMarquee);
  run('intro', initIntro);
  run('roles', initRoles);
  run('works', initWorks);
  run('modal', initModal);
  run('field', initField);
  run('slate', initSlate);
  run('book', initBook);
  run('postcard', initPostcard);
  run('honors', initHonors);
  run('quote', initQuote);
  run('gallery', initGallery);
  run('sources', initSources);
  run('reveals', initReveals);
  run('loader', () => initLoader(heroIntro));

  if (hasGSAP) {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    addEventListener('load', refresh);
  }
})();
