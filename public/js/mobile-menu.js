// mobile-menu.js
// Menangani buka/tutup hamburger menu khusus tampilan mobile (<=768px)
(function () {
  const asideEl = document.querySelector('#mainApp aside');
  const toggleBtn = document.getElementById('menuToggle');
  const menuEl = document.getElementById('menu');

  if (!asideEl || !toggleBtn) return;

  function openMenu() {
    asideEl.classList.add('menu-open');
    toggleBtn.classList.add('active');
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    asideEl.classList.remove('menu-open');
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (asideEl.classList.contains('menu-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Klik tombol hamburger buka/tutup menu
  toggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  // Klik salah satu item menu -> otomatis tutup dropdown
  if (menuEl) {
    menuEl.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON') {
        closeMenu();
      }
    });
  }

  // Klik di luar area sidebar (mis. di konten utama) -> tutup menu
  document.addEventListener('click', function (e) {
    if (window.innerWidth > 768) return;
    if (!asideEl.contains(e.target)) {
      closeMenu();
    }
  });

  // Kalau layar di-resize balik ke desktop, pastikan menu tidak "nyangkut" terbuka
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });
})();