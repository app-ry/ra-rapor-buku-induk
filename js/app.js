// app.js — main router & shell
window.App = (function() {
  const ROUTES = [
    { path:'dashboard', icon:'bi-house-door', label:'Dashboard', render:()=>Pages.dashboard.render(), roles:['admin','kepala','guru','operator'] },
    { path:'profil', icon:'bi-building', label:'Profil RA', render:()=>Pages.profil.render(), roles:['admin','kepala'] },
    { path:'tahun-ajaran', icon:'bi-calendar-range', label:'Tahun Ajaran', render:()=>Pages.tahun_ajaran.render(), roles:['admin'] },
    { path:'guru', icon:'bi-person-badge', label:'Data Guru', render:()=>Pages.guru.render(), roles:['admin','kepala'] },
    { path:'kelas', icon:'bi-collection', label:'Data Kelas', render:()=>Pages.kelas.render(), roles:['admin','kepala'] },
    { path:'buku-induk', icon:'bi-journal-text', label:'Buku Induk', render:()=>Pages.buku_induk.render(), roles:['admin','kepala','guru','operator'] },
    { path:'indikator', icon:'bi-list-check', label:'Bank Indikator', render:()=>Pages.indikator.render(), roles:['admin','kepala','guru'] },
    { path:'asesmen', icon:'bi-clipboard-check', label:'Input Asesmen', render:()=>Pages.asesmen.render(), roles:['admin','kepala','guru'] },
    { path:'generate', icon:'bi-magic', label:'Generate Deskripsi', render:()=>Pages.generate.render(), roles:['admin','kepala','guru'] },
    { path:'rapor', icon:'bi-file-text', label:'Rapor RA', render:()=>Pages.rapor.render(), roles:['admin','kepala','guru'] },
    { path:'cetak', icon:'bi-printer', label:'Cetak & Export', render:(ctx)=>Pages.cetak.render(ctx), roles:['admin','kepala','guru','operator'] },
    { path:'cetak-induk', icon:'bi-journal-text', label:'Cetak Buku Induk', render:(ctx)=>Pages.cetak_induk.render(ctx), roles:['admin','kepala','guru','operator'], hidden:true },
    { path:'rekap', icon:'bi-bar-chart', label:'Rekap Perkembangan', render:()=>Pages.rekap.render(), roles:['admin','kepala','guru'] },
    { path:'pengguna', icon:'bi-people', label:'Pengaturan Pengguna', render:()=>Pages.pengguna.render(), roles:['admin'] },
    { path:'backup', icon:'bi-cloud-arrow-down', label:'Backup Data', render:()=>Pages.backup.render(), roles:['admin'] },
    { path:'license', icon:'bi-shield-lock', label:'Lisensi', render:()=>Pages.license.render(), roles:['admin'] }
  ];

  // Pages namespace
  window.Pages = window.Pages || {};

  function init() {
    License.init();
    if (Seed.needsSeed()) {
      Seed.seedAll();
    }
    const user = Store.currentUser();
    if (!user) {
      showLogin();
    } else {
      showApp(user);
    }
  }

  function showLogin() {
    document.getElementById('loginScreen').classList.remove('d-none');
    document.getElementById('appShell').classList.add('d-none');
    const f = document.getElementById('loginForm');
    f.onsubmit = (e) => {
      e.preventDefault();
      const u = document.getElementById('loginUsername').value.trim();
      const p = document.getElementById('loginPassword').value;
      const user = Store.login(u, p);
      if (!user) {
        U.toast('Username atau password salah', 'danger');
        return;
      }
      Store.log('login', user.id);
      showApp(user);
    };
  }

  function showApp(user) {
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('appShell').classList.remove('d-none');

    const ls = License.status();
    if (ls.state === 'expired' && user.role !== 'admin') {
      // Non-admin: redirect to license page if expired
      document.getElementById('sidebarRaName').textContent = 'Lisensi Kadaluarsa';
      location.hash = '#/license';
    }

    _displayLicenseWarning(ls);

    const profil = Store.getObj('profil_ra', {});
    document.getElementById('sidebarRaName').textContent = profil.nama || 'RA Demo';

    const userPill = document.getElementById('userPill');
    const roleLabel = ({ admin:'Admin', kepala:'Kepala RA', guru:'Guru Kelas', operator:'Operator' })[user.role] || user.role;
    userPill.innerHTML = `<i class="bi bi-person-circle"></i> <div><div class="fw-semibold">${U.esc(user.nama)}</div><div style="font-size:10px;opacity:0.8">${U.esc(roleLabel)}</div></div>`;

    renderNav(user);

    document.getElementById('btnLogout').onclick = doLogout;
    document.getElementById('btnLogoutMobile').onclick = doLogout;
    document.getElementById('btnSidebarToggle').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
    };

    window.addEventListener('hashchange', route);
    if (!location.hash) location.hash = '#/dashboard';
    route();
  }

  function renderNav(user) {
    const ul = document.getElementById('navList');
    const items = ROUTES.filter(r => (!r.roles || r.roles.includes(user.role)) && !r.hidden);
    ul.innerHTML = items.map(r =>
      `<li><a href="#/${r.path}" data-path="${r.path}"><i class="bi ${r.icon}"></i> ${U.esc(r.label)}</a></li>`
    ).join('');
  }

  function route() {
    const user = Store.currentUser();
    if (!user) { showLogin(); return; }

    const ls = License.status();
    // Expired: only license page accessible
    if (ls.state === 'expired') {
      const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
      if (hash.split('/')[0] !== 'license') {
        location.hash = '#/license';
        return;
      }
    }
    // Show/clear banner as needed
    if (ls.state === 'trial' || ls.state === 'grace' || ls.warn) {
      _displayLicenseWarning(ls);
    } else {
      _clearLicenseBanner();
    }

    const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [path, ...rest] = hash.split('/');
    const params = rest;
    const r = ROUTES.find(x => x.path === path);
    const root = document.getElementById('pageRoot');
    if (!r) {
      root.innerHTML = `<div class="empty"><i class="bi bi-question-circle"></i><div>Halaman tidak ditemukan</div></div>`;
      return;
    }
    if (r.roles && !r.roles.includes(user.role)) {
      root.innerHTML = `<div class="empty"><i class="bi bi-lock"></i><div>Akses ditolak untuk role <b>${user.role}</b></div></div>`;
      return;
    }
    document.querySelectorAll('#navList a').forEach(a => {
      a.classList.toggle('active', a.dataset.path === path);
    });
    document.getElementById('sidebar').classList.remove('open');
    try {
      r.render({ params });
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="alert alert-danger">Error rendering: ${U.esc(e.message)}</div>`;
    }
  }

  function doLogout() {
    Store.log('logout', null);
    Store.logout();
    location.hash = '';
    location.reload();
  }

  function go(path) {
    location.hash = '#/' + path;
  }

  function _displayLicenseWarning(ls) {
    const root = document.getElementById('pageRoot');
    // Remove existing banner
    const existing = document.getElementById('licenseBanner');
    if (existing) existing.remove();

    if (ls.state === 'active' && ls.warn) {
      const banner = document.createElement('div');
      banner.id = 'licenseBanner';
      banner.style.cssText = 'background:#fff3cd;color:#664d03;padding:8px 16px;font-size:13px;text-align:center;border-bottom:1px solid #ffc107;';
      banner.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Lisensi akan berakhir dalam <b>${ls.days_left}</b> hari. <a href="#/license" style="color:#664d03;font-weight:700;text-decoration:underline">Perpanjang sekarang</a>`;
      root.parentNode.insertBefore(banner, root);
    } else if (ls.state === 'trial') {
      const banner = document.createElement('div');
      banner.id = 'licenseBanner';
      banner.style.cssText = 'background:#cff4fc;color:#055160;padding:8px 16px;font-size:13px;text-align:center;border-bottom:1px solid #0dcaf0;';
      banner.innerHTML = `<i class="bi bi-info-circle"></i> Masa uji coba: sisa <b>${ls.days_left}</b> hari. <a href="#/license" style="color:#055160;font-weight:700;text-decoration:underline">Aktifkan lisensi</a>`;
      root.parentNode.insertBefore(banner, root);
    } else if (ls.state === 'grace') {
      const banner = document.createElement('div');
      banner.id = 'licenseBanner';
      banner.style.cssText = 'background:#ffe69c;color:#664d03;padding:8px 16px;font-size:13px;text-align:center;border-bottom:1px solid #ffc107;';
      banner.innerHTML = `<i class="bi bi-exclamation-diamond"></i> Masa uji coba berakhir! Segera <a href="#/license" style="color:#664d03;font-weight:700;text-decoration:underline">aktivasi lisensi</a> (${ls.days_left} hari tersisa)`;
      root.parentNode.insertBefore(banner, root);
    }
  }

  function _clearLicenseBanner() {
    const existing = document.getElementById('licenseBanner');
    if (existing) existing.remove();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { go, route };
})();
