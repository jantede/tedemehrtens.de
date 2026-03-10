/* Theme initialisation — must load synchronously before first paint */
(function () {
  const mode = localStorage.getItem('theme-mode') || 'auto';
  const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = (mode === 'auto') ? sys : mode;
}());
