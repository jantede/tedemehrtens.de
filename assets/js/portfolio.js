/* portfolio.js — theme, navigation, interactions */
(function () {
  const html = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  function initThemePicker() {
    const toggle = document.getElementById('theme-toggle');
    const dropdown = document.getElementById('theme-dropdown');
    if (!toggle || !dropdown) return;

    const options = Array.from(dropdown.querySelectorAll('.theme-option'));

    function resolveTheme(mode) {
      return mode === 'auto' ? (darkScheme.matches ? 'dark' : 'light') : mode;
    }

    function setActive(mode) {
      options.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === mode));
    }

    function applyMode(mode) {
      html.dataset.themeMode = mode;
      html.dataset.theme = resolveTheme(mode);
      if (mode === 'auto') localStorage.removeItem('theme-mode');
      else localStorage.setItem('theme-mode', mode);
      setActive(mode);
    }

    function closeDropdown() {
      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function openDropdown() {
      dropdown.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      options[0].focus();
    }

    const initialMode = html.dataset.themeMode || 'auto';
    setActive(initialMode);

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !dropdown.classList.contains('open');
      if (open) openDropdown();
      else closeDropdown();
    });

    options.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        applyMode(btn.dataset.mode);
        closeDropdown();
        toggle.focus();
      });

      btn.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          options[(index + 1) % options.length].focus();
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          options[(index - 1 + options.length) % options.length].focus();
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target) && event.target !== toggle) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
        toggle.focus();
      }
    });

    darkScheme.addEventListener('change', (event) => {
      if ((html.dataset.themeMode || 'auto') === 'auto') {
        html.dataset.theme = event.matches ? 'dark' : 'light';
      }
    });
  }

  function initMouseSpotlight() {
    if (reduceMotion.matches) return;

    let rafPending = false;
    document.addEventListener('mousemove', (event) => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        document.body.style.setProperty('--mouse-x', `${event.clientX}px`);
        document.body.style.setProperty('--mouse-y', `${event.clientY}px`);
        rafPending = false;
      });
    });

    document.addEventListener('mouseleave', () => {
      document.body.style.setProperty('--mouse-x', '-999px');
      document.body.style.setProperty('--mouse-y', '-999px');
    });
  }

  function initHeroConstellation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof window.createConstellation !== 'function') return;

    window.createConstellation({
      canvas,
      nodeCount: 100,
      maxEdge: 100,
      revealRadius: 190,
      ghostNode: 0.05,
      ghostEdge: 0.03,
      disableOnMobile: true,
      reduceMotion,
      colorResolver: () => [88, 166, 255],
      boundsResolver: (targetCanvas) => ({
        x0: targetCanvas.width * 0.4,
        x1: targetCanvas.width,
        y0: 0,
        y1: targetCanvas.height,
      }),
    });
  }

  function initMobileNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (!navToggle || !navLinks) return;

    function closeMenu() {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }

    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (!navLinks.contains(event.target) && !navToggle.contains(event.target)) closeMenu();
    });
  }

  function initYouTubeConsent() {
    const embeds = Array.from(document.querySelectorAll('.youtube-embed[data-youtube-id]'));
    if (!embeds.length) return;

    const CONSENT_KEY = 'youtube-consent';

    function createFrame(embed) {
      const id = embed.dataset.youtubeId;
      const title = embed.dataset.youtubeTitle || 'YouTube video';
      const frameWrap = embed.querySelector('[data-youtube-frame-wrap]');
      const consentBox = embed.querySelector('[data-youtube-consent-box]');
      if (!id || !frameWrap || !consentBox) return;

      frameWrap.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
      iframe.title = title;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      frameWrap.appendChild(iframe);

      consentBox.hidden = true;
      frameWrap.hidden = false;
    }

    function grantConsent(embed, remember) {
      if (remember) {
        localStorage.setItem(CONSENT_KEY, 'granted');
      }
      createFrame(embed);
    }

    const globalConsent = localStorage.getItem(CONSENT_KEY) === 'granted';
    embeds.forEach((embed) => {
      if (globalConsent) {
        createFrame(embed);
        return;
      }

      const allowBtn = embed.querySelector('[data-youtube-allow]');
      const rememberBtn = embed.querySelector('[data-youtube-allow-remember]');

      if (allowBtn) {
        allowBtn.addEventListener('click', () => grantConsent(embed, false));
      }
      if (rememberBtn) {
        rememberBtn.addEventListener('click', () => grantConsent(embed, true));
      }
    });
  }

  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let rafPending = false;
    function update() {
      navbar.classList.toggle('scrolled', window.scrollY > 8);
    }

    window.addEventListener('scroll', () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        update();
        rafPending = false;
      });
    }, { passive: true });

    update();
  }

  function initScrollReveal() {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

    // Sections (below the hero) reveal as a whole; cards inside grids stagger.
    const sections = Array.from(document.querySelectorAll('.section'));
    const staggerSelector = '.post-grid > *, .talk-list > *, .cert-list > *, .timeline > *, .post-related-grid > *';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    sections.forEach((section) => {
      const items = Array.from(section.querySelectorAll(staggerSelector));

      if (items.length) {
        // Reveal the section shell instantly, stagger its items.
        items.forEach((item, index) => {
          item.classList.add('reveal');
          item.style.setProperty('--reveal-delay', `${Math.min(index * 70, 420)}ms`);
          observer.observe(item);
        });
      }

      const title = section.querySelector('.section-title');
      if (title) {
        title.classList.add('reveal');
        observer.observe(title);
      }
    });
  }

  function initScrollSpy() {
    const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="/#"]'));
    if (!navLinks.length || !('IntersectionObserver' in window)) return;

    const linkById = new Map();
    navLinks.forEach((link) => {
      linkById.set(link.getAttribute('href').slice(2), link);
    });

    const sections = Array.from(linkById.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = linkById.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((other) => other.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach((section) => observer.observe(section));
  }

  initThemePicker();
  initMouseSpotlight();
  initHeroConstellation();
  initMobileNavigation();
  initYouTubeConsent();
  initNavbarScroll();
  initScrollReveal();
  initScrollSpy();
})();
