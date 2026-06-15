// utils.js — helpers
window.U = (function() {
  function uid(prefix='id') {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function fmtDate(d) {
    if (!d) return '';
    if (typeof d === 'string') {
      // YYYY-MM-DD
      const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        return `${parseInt(m[3],10)} ${bulan[parseInt(m[2],10)-1]} ${m[1]}`;
      }
      return d;
    }
    return d.toString();
  }
  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0,10);
  }
  function toast(msg, kind='success') {
    const id = uid('t');
    const colors = { success:'bg-success', danger:'bg-danger', warning:'bg-warning', info:'bg-info' };
    const html = `
      <div id="${id}" class="toast align-items-center text-white ${colors[kind]||'bg-success'} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">${esc(msg)}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`;
    const c = document.getElementById('toastContainer');
    c.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const t = new bootstrap.Toast(el, { delay: 3000 });
    t.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }
  function confirmModal(opts) {
    return new Promise(resolve => {
      const id = uid('m');
      const root = document.getElementById('modalRoot');
      const html = `
      <div class="modal fade" id="${id}" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${esc(opts.title || 'Konfirmasi')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">${opts.bodyHTML || esc(opts.body || 'Lanjutkan?')}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-act="no">${esc(opts.cancelText || 'Batal')}</button>
              <button type="button" class="btn btn-${opts.danger?'danger':'success'}" data-act="yes">${esc(opts.okText || 'OK')}</button>
            </div>
          </div>
        </div>
      </div>`;
      root.insertAdjacentHTML('beforeend', html);
      const el = document.getElementById(id);
      const m = new bootstrap.Modal(el);
      let val = false;
      el.querySelector('[data-act="yes"]').addEventListener('click', () => { val = true; m.hide(); });
      el.addEventListener('hidden.bs.modal', () => { el.remove(); resolve(val); });
      m.show();
    });
  }
  function showModal(opts) {
    const id = uid('m');
    const root = document.getElementById('modalRoot');
    const sizeClass = opts.size === 'lg' ? 'modal-lg' : opts.size === 'xl' ? 'modal-xl' : '';
    const html = `
      <div class="modal fade" id="${id}" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${sizeClass}">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${esc(opts.title || '')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">${opts.bodyHTML || ''}</div>
            ${opts.footerHTML ? `<div class="modal-footer">${opts.footerHTML}</div>` : ''}
          </div>
        </div>
      </div>`;
    root.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const m = new bootstrap.Modal(el, { backdrop: opts.backdrop || true });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    m.show();
    if (opts.onShow) opts.onShow(el);
    return { el, modal: m, close: () => m.hide() };
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 200);
  }
  function fileToDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  function asNum(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
  return { uid, esc, fmtDate, todayISO, toast, confirmModal, showModal, downloadBlob, fileToDataURL, asNum };
})();
