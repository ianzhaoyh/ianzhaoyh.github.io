/* ============================================================
   Yunhao Zhao — Site Logic
   Splash transition, sidebar nav, scroll tracking
   ============================================================ */

// ── Splash → Main ───────────────────────────────────────────
let onSplash = true;

window.enterMainSite = function () {
  if (!onSplash) return;
  onSplash = false;
  const splash = document.getElementById('splash');
  const site = document.getElementById('mainSite');
  splash.classList.add('exiting');
  setTimeout(() => {
    splash.style.display = 'none';
    site.classList.add('active');
    document.body.style.overflow = '';
    if (window.particleEngine) window.particleEngine.stop();
    // Kick off reveal for visible panels
    revealObserver.observe(document.querySelectorAll('.panel'));
    panels.forEach(p => revealObserver.observe(p));
  }, 700);
};

// ── Scroll-reveal panels ────────────────────────────────────
const panels = document.querySelectorAll('.panel');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  },
  { threshold: 0.05 }
);

// ── Sidebar nav: highlight active section on scroll ─────────
const navItems = document.querySelectorAll('.nav-item');
const sectionIds = Array.from(navItems).map(a => a.dataset.section);

function updateActiveNav() {
  const scrollY = document.getElementById('content')
    ? window.scrollY
    : 0;
  let current = sectionIds[0];
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el && el.offsetTop - 120 <= scrollY) current = id;
  }
  navItems.forEach(a => {
    a.classList.toggle('active', a.dataset.section === current);
  });
}
window.addEventListener('scroll', updateActiveNav);

// Smooth scroll on nav click
navItems.forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.dataset.section;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // close mobile sidebar if open
      closeSidebar();
    }
  });
});

// ── Mobile sidebar toggle ───────────────────────────────────
let overlay = null;

function ensureOverlay() {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }
}

window.toggleSidebar = function () {
  ensureOverlay();
  const sb = document.getElementById('sidebar');
  const isOpen = sb.classList.contains('open');
  if (isOpen) {
    closeSidebar();
  } else {
    sb.classList.add('open');
    overlay.classList.add('open');
  }
};

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ── Back to splash (click logo area) ────────────────────────
window.goSplash = function (e) {
  if (e) e.preventDefault();
  const splash = document.getElementById('splash');
  const site = document.getElementById('mainSite');
  site.classList.remove('active');
  splash.style.display = '';
  splash.classList.remove('exiting');
  onSplash = true;
  if (window.particleEngine) window.particleEngine.start();
};
