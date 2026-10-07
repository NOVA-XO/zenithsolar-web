(() => {
  const root = document.documentElement;

  /* Өнгөний горим: хэрэглэгчийн сонголтыг санана; хадгалах боломжгүй бол системийнхийг дагана. */
  let saved = null;
  try { saved = localStorage.getItem('zs-theme'); } catch { /* private mode */ }
  if (saved) { root.dataset.theme = saved; }
  const themeBtn = document.getElementById('theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const dark = root.dataset.theme
        ? root.dataset.theme === 'dark'
        : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('zs-theme', root.dataset.theme); } catch { /* ignore */ }
    });
  }

  /* Гар утасны цэс. */
  const menu = document.getElementById('menu');
  const nav = document.getElementById('nav');
  if (menu && nav) {
    const set = (open) => { nav.classList.toggle('open', open); menu.setAttribute('aria-expanded', String(open)); };
    menu.addEventListener('click', () => set(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) { set(false); } });
  }

  /* Төслийн зургийн ангилал. */
  const buttons = document.querySelectorAll('.filters button');
  buttons.forEach((b) => b.addEventListener('click', () => {
    buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.getElementById('gallery').classList.toggle('filtered', b.dataset.filter !== 'all');
    document.querySelectorAll('#gallery figure').forEach((f) => {
      f.hidden = b.dataset.filter !== 'all' && f.dataset.cat !== b.dataset.filter;
    });
  }));

  /* Зургийг томоор харах. */
  const box = document.getElementById('lightbox');
  if (box) {
    const big = box.querySelector('img');
    const close = () => { box.hidden = true; big.removeAttribute('src'); };
    document.querySelectorAll('#gallery figure').forEach((f) => {
      f.tabIndex = 0;
      const open = () => {
        const img = f.querySelector('img');
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        box.hidden = false;
        document.getElementById('lightbox-close').focus();
      };
      f.addEventListener('click', open);
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('#lightbox-close')) { close(); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) { close(); } });
  }

  /* Гүйлгэхэд хэсгүүд зөөлөн гарч ирнэ (хөдөлгөөн багасгах тохиргоотой бол шууд). */
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  const year = document.getElementById('year');
  if (year) { year.textContent = String(new Date().getFullYear()); }
})();
