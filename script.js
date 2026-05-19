(function () {
  const nav = document.querySelector('.site-nav');
  const btn = document.getElementById('nav-btn');
  const menu = document.getElementById('nav-mobile');
  const logoImg = document.querySelector('.nav-logo-wrap img');

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));

  // Logo animation: large in hero, docks small into nav on scroll
  const LOGO_LARGE = 280;
  const LOGO_SMALL = 50;
  const START_Y = 150;
  const SCROLL_RANGE = 280;

  function updateLogo() {
    const t = Math.min(window.scrollY / SCROLL_RANGE, 1);
    const size = LOGO_LARGE + (LOGO_SMALL - LOGO_LARGE) * t;
    const y = START_Y * (1 - t);
    logoImg.style.width = size + 'px';
    logoImg.style.height = size + 'px';
    logoImg.style.transform = `translateY(${y}px)`;
    nav.classList.toggle('scrolled', t >= 1);
  }

  window.addEventListener('scroll', updateLogo, { passive: true });
  updateLogo();

  // Scroll-spy: highlight nav link for the section currently in view
  const allNavLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');
  const sections = document.querySelectorAll('section[id]');

  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      allNavLinks.forEach(a => a.classList.remove('active'));
      allNavLinks.forEach(a => {
        if (a.getAttribute('href') === `#${entry.target.id}`) {
          a.classList.add('active');
        }
      });
    });
  }, { rootMargin: '-70px 0px -80% 0px' });

  sections.forEach(s => spy.observe(s));

  // Newsletter forms — AJAX submit + thank-you modal
  const modal = document.getElementById('subscribe-modal');
  const modalClose = modal.querySelector('.modal-close');

  function openModal() {
    modal.hidden = false;
    modal.querySelector('.modal-close').focus();
  }
  function closeModal() {
    modal.hidden = true;
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  document.querySelectorAll('.about-newsletter-form, .newsletter form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(form);
      try {
        const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
        const json = await res.json();
        if (json.success) {
          form.reset();
          openModal();
        }
      } catch (_) {}
    });
  });
})();
