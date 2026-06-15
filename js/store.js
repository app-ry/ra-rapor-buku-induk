// store.js — localStorage CRUD
window.Store = (function() {
  const PREFIX = 'ra_v1_';
  const KEYS = [
    'users','session','profil_ra','tahun_ajaran','semester',
    'guru','kelas','murid','indikator','asesmen','rapor','log_aktivitas'
  ];
  function _k(name) { return PREFIX + name; }
  function _read(name, def) {
    try {
      const raw = localStorage.getItem(_k(name));
      if (raw == null) return def;
      return JSON.parse(raw);
    } catch (e) { return def; }
  }
  function _write(name, val) {
    localStorage.setItem(_k(name), JSON.stringify(val));
  }

  // Generic list helpers
  function list(name) { return _read(name, []); }
  function setList(name, arr) { _write(name, arr); }
  function findById(name, id) { return list(name).find(x => x.id === id) || null; }
  function add(name, obj) {
    const arr = list(name);
    if (!obj.id) obj.id = U.uid(name.slice(0,3));
    arr.push(obj);
    _write(name, arr);
    return obj;
  }
  function update(name, id, patch) {
    const arr = list(name);
    const i = arr.findIndex(x => x.id === id);
    if (i < 0) return null;
    arr[i] = Object.assign({}, arr[i], patch);
    _write(name, arr);
    return arr[i];
  }
  function remove(name, id) {
    const arr = list(name).filter(x => x.id !== id);
    _write(name, arr);
  }
  function upsertBy(name, key, obj) {
    const arr = list(name);
    const i = arr.findIndex(x => x[key] === obj[key]);
    if (i >= 0) {
      arr[i] = Object.assign({}, arr[i], obj);
      _write(name, arr);
      return { mode:'update', item: arr[i] };
    } else {
      if (!obj.id) obj.id = U.uid(name.slice(0,3));
      arr.push(obj);
      _write(name, arr);
      return { mode:'create', item: obj };
    }
  }

  // Singletons (object, not array)
  function getObj(name, def) { return _read(name, def); }
  function setObj(name, val) { _write(name, val); }

  // Migrasi auto: update password admin lama (admin123) ke @riyant1970
  function migrateAdminPassword() {
    try {
      const arr = list('users');
      let changed = false;
      arr.forEach(u => {
        if (u.username === 'admin' && u.password === 'admin123') {
          u.password = '@riyant1970';
          changed = true;
        }
      });
      if (changed) setList('users', arr);
    } catch (e) { /* ignore */ }
  }
  // run migration on module load
  if (typeof window !== 'undefined') migrateAdminPassword();

  // Session helpers
  function login(username, password) {
    const u = list('users').find(x => x.username === username && x.password === password);
    if (!u) return null;
    const sess = { user_id: u.id, login_at: Date.now() };
    setObj('session', sess);
    return u;
  }
  function logout() { localStorage.removeItem(_k('session')); }
  function currentUser() {
    const s = getObj('session', null);
    if (!s) return null;
    return findById('users', s.user_id);
  }

  // Active context
  function activeTA() {
    const arr = list('tahun_ajaran');
    return arr.find(x => x.aktif) || arr[0] || null;
  }
  function activeSem() {
    const ta = activeTA();
    if (!ta) return null;
    const arr = list('semester').filter(x => x.ta_id === ta.id);
    return arr.find(x => x.aktif) || arr[0] || null;
  }

  // Logging
  function log(action, target) {
    const u = currentUser();
    add('log_aktivitas', {
      user_id: u ? u.id : null,
      action, target,
      ts: Date.now()
    });
  }

  // Backup all
  function exportAll() {
    const out = { _meta: { version:'ra_v1', exported_at: new Date().toISOString() } };
    KEYS.forEach(k => out[k] = _read(k, k === 'profil_ra' ? null : []));
    return out;
  }
  function importAll(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Format tidak dikenali');
    KEYS.forEach(k => {
      if (k in payload) _write(k, payload[k]);
    });
  }
  function resetAll() {
    KEYS.forEach(k => localStorage.removeItem(_k(k)));
  }

  return {
    PREFIX, KEYS,
    list, setList, findById, add, update, remove, upsertBy,
    getObj, setObj,
    login, logout, currentUser,
    activeTA, activeSem,
    log,
    exportAll, importAll, resetAll
  };
})();
