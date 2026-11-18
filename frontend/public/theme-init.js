(function () {
  try {
    var stored = localStorage.getItem('kimovolt-color-scheme');
    var scheme = stored === 'light' || stored === 'dark' ? stored : stored === 'system' ? 'light dark' : 'dark';
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', scheme);
  } catch (e) {}
})();
