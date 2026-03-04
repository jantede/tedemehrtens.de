/* portfolio.js — theme toggle, spotlight, mobile nav */

// === Theme ===
const html   = document.documentElement;
const toggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  html.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

if (toggle) {
  toggle.addEventListener('click', () => {
    applyTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

// System theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
});

// === Mouse spotlight (throttled via rAF) ===
let rafPending = false;
document.addEventListener('mousemove', (e) => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    rafPending = false;
  });
});

// Reset spotlight when mouse leaves window
document.addEventListener('mouseleave', () => {
  document.body.style.setProperty('--mouse-x', '-999px');
  document.body.style.setProperty('--mouse-y', '-999px');
});

// === Mobile Nav ===
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
