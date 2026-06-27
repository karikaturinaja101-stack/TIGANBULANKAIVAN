(function () {
  const Store = window.BaliInviteStore;
  let data;
  const $ = (id) => document.getElementById(id);

  const sectionTitles = {
    dashboard: 'Dashboard',
    acara: 'Pengaturan Acara',
    foto: 'Foto Utama',
    galeri: 'Galeri Kenangan',
    musik: 'Musik Undangan',
    tamu: 'Daftar Tamu',
    rsvp: 'RSVP & Ucapan',
    tema: 'Tampilan / Tema',
    backup: 'Backup & Akun'
  };

  async function init() {
    await Store.ready();
    data = Store.loadData();
    const session = sessionStorage.getItem(Store.SESSION_KEY) === 'true';
    if (session) showAdmin();
    bindLogin();
    bindNavigation();
    bindForms();
  }

  function bindLogin() {
    $('loginForm').addEventListener('submit', (event) => {
      event.preventDefault();
      data = Store.loadData();
      const user = $('loginUser').value.trim();
      const pass = $('loginPass').value;
      if (user === data.settings.adminUsername && pass === data.settings.adminPassword) {
        sessionStorage.setItem(Store.SESSION_KEY, 'true');
        showAdmin();
      } else {
        showToast('Username atau password salah.');
      }
    });
    $('logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem(Store.SESSION_KEY);
      location.reload();
    });
  }

  function showAdmin() {
    $('loginScreen').classList.add('hidden');
    $('adminShell').classList.remove('hidden');
    renderAll();
  }

  function bindNavigation() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => activateSection(btn.dataset.section));
    });
    document.querySelectorAll('[data-jump]').forEach((btn) => {
      btn.addEventListener('click', () => activateSection(btn.dataset.jump));
    });
  }

  function activateSection(name) {
    document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.section === name));
    document.querySelectorAll('.admin-section').forEach((section) => section.classList.toggle('active', section.id === `section-${name}`));
    $('sectionTitle').textContent = sectionTitles[name] || 'Admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindForms() {
    $('eventForm').addEventListener('submit', saveEventSettings);
    $('themeForm').addEventListener('submit', saveThemeSettings);
    $('musicForm').addEventListener('submit', saveMusicSettings);
    $('guestForm').addEventListener('submit', addGuest);
    $('accountForm').addEventListener('submit', saveAccount);

    $('mainPhotoInput').addEventListener('change', uploadMainPhoto);
    $('clearMainPhoto').addEventListener('click', clearMainPhoto);
    $('musicInput').addEventListener('change', uploadMusic);
    $('clearMusic').addEventListener('click', clearMusic);
    $('saveGalleryCaptions').addEventListener('click', saveGalleryCaptions);
    if ($('galleryBulkInput')) $('galleryBulkInput').addEventListener('change', uploadGalleryBulk);
    $('guestCsvInput').addEventListener('change', importGuestsCsv);
    $('exportGuests').addEventListener('click', exportGuestsCsv);
    $('exportRsvp').addEventListener('click', exportRsvpCsv);
    $('clearRsvp').addEventListener('click', clearRsvp);
    $('exportJson').addEventListener('click', exportJson);
    $('importJson').addEventListener('change', importJson);
    $('resetAll').addEventListener('click', resetAll);
  }

  function ensureEightGallerySlots() {
    if (!Array.isArray(data.gallery)) data.gallery = [];
    while (data.gallery.length < 8) {
      const next = data.gallery.length + 1;
      data.gallery.push({ id: Store.cryptoId(), image: '', caption: `Kenangan ${next}`, sortOrder: next });
    }
    data.gallery = data.gallery.slice(0, 8).map((item, index) => ({
      id: item.id || Store.cryptoId(),
      image: item.image || '',
      caption: item.caption || `Kenangan ${index + 1}`,
      sortOrder: item.sortOrder || index + 1
    }));
  }

  function renderAll() {
    data = Store.loadData();
    ensureEightGallerySlots();
    renderStats();
    fillEventForm();
    renderMainPhotoPreview();
    renderGalleryAdmin();
    fillMusicForm();
    renderGuestTable();
    renderRsvpTable();
    fillThemeForm();
    fillAccountForm();
  }

  function renderStats() {
    const hadir = data.rsvps.filter((r) => r.status === 'Hadir').length;
    const totalOrang = data.rsvps.filter((r) => r.status === 'Hadir').reduce((sum, r) => sum + Number(r.guestCount || 0), 0);
    const sync = Store.getSyncStatus ? Store.getSyncStatus() : { configured: false };
    const stats = [
      ['Tamu Undangan', data.guests.length],
      ['RSVP Hadir', hadir],
      ['Estimasi Orang', totalOrang],
      ['Ucapan Masuk', data.rsvps.length],
      ['Database', sync.configured ? 'Supabase' : 'Lokal']
    ];
    $('statsGrid').innerHTML = stats.map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
  }

  function fillEventForm() {
    const form = $('eventForm');
    const keys = ['invitationTitle', 'subheader', 'eventTitle', 'childName', 'fatherName', 'motherName', 'eventDate', 'eventTime', 'timezoneLabel', 'locationName', 'address', 'mapsUrl', 'mapsEmbedUrl', 'whatsappNumber', 'openingText', 'closingText', 'countdownEnabled'];
    keys.forEach((key) => {
      const input = form.elements[key];
      if (!input) return;
      if (typeof data.settings[key] === 'boolean') input.value = String(data.settings[key]);
      else input.value = data.settings[key] || '';
    });
  }

  function saveEventSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const keys = ['invitationTitle', 'subheader', 'eventTitle', 'childName', 'fatherName', 'motherName', 'eventDate', 'eventTime', 'timezoneLabel', 'locationName', 'address', 'mapsUrl', 'mapsEmbedUrl', 'whatsappNumber', 'openingText', 'closingText'];
    keys.forEach((key) => data.settings[key] = String(fd.get(key) || '').trim());
    data.settings.countdownEnabled = fd.get('countdownEnabled') === 'true';
    Store.saveData(data);
    showToast('Pengaturan acara berhasil disimpan.');
    renderAll();
  }

  function renderMainPhotoPreview() {
    const preview = $('mainPhotoPreview');
    if (data.settings.mainPhoto) preview.innerHTML = `<img src="${data.settings.mainPhoto}" alt="Foto utama" />`;
    else preview.textContent = 'Belum ada foto utama';
  }

  async function uploadMainPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await Store.fileToDataURL(file, 10);
      data.settings.mainPhoto = dataUrl;
      Store.saveData(data);
      renderMainPhotoPreview();
      showToast('Foto utama berhasil diganti.');
    } catch (error) {
      showToast(error.message);
    } finally {
      event.target.value = '';
    }
  }

  function clearMainPhoto() {
    if (!confirm('Hapus foto utama?')) return;
    data.settings.mainPhoto = '';
    Store.saveData(data);
    renderMainPhotoPreview();
    showToast('Foto utama dihapus.');
  }

  function renderGalleryAdmin() {
    const wrap = $('galleryAdminGrid');
    wrap.innerHTML = '';
    data.gallery.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'gallery-admin-item';
      card.innerHTML = `
        <div class="preview-box" id="galleryPreview-${index}">${item.image ? `<img src="${item.image}" alt="Foto ${index + 1}" />` : `Foto ${index + 1}`}</div>
        <div class="field"><label>Caption ${index + 1}</label><input class="input gallery-caption" data-index="${index}" value="${Store.escapeHtml(item.caption)}" /></div>
        <div class="field"><label>Upload Foto ${index + 1}</label><input class="input gallery-input" data-index="${index}" type="file" accept="image/*" /></div>
        <div class="cta-row"><button class="btn secondary small clear-gallery" data-index="${index}" type="button">Hapus</button></div>
      `;
      wrap.appendChild(card);
    });
    document.querySelectorAll('.gallery-input').forEach((input) => input.addEventListener('change', uploadGalleryPhoto));
    document.querySelectorAll('.clear-gallery').forEach((btn) => btn.addEventListener('click', clearGalleryPhoto));
  }

  async function uploadGalleryPhoto(event) {
    const index = Number(event.target.dataset.index);
    const file = event.target.files[0];
    if (!file) return;
    try {
      setUploadProgress(`Mengupload Foto ${index + 1}...`);
      const imageUrl = await Store.fileToDataURL(file, 10);
      ensureEightGallerySlots();
      data.gallery[index].image = imageUrl;
      data.gallery[index].caption = document.querySelector(`.gallery-caption[data-index="${index}"]`)?.value || data.gallery[index].caption || `Kenangan ${index + 1}`;
      Store.saveData(data);
      renderGalleryAdmin();
      showToast(`Foto galeri ${index + 1} berhasil diupload.`);
    } catch (error) {
      showToast(error.message || 'Upload foto gagal.');
    } finally {
      event.target.value = '';
      setUploadProgress('');
    }
  }

  async function uploadGalleryBulk(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    if (files.length > 8) showToast('Yang dipakai hanya 8 foto pertama.');

    try {
      ensureEightGallerySlots();
      const selected = files.slice(0, 8);
      for (let i = 0; i < selected.length; i++) {
        setUploadProgress(`Mengupload foto ${i + 1} dari ${selected.length}...`);
        const imageUrl = await Store.fileToDataURL(selected[i], 10);
        data.gallery[i].image = imageUrl;
        if (!data.gallery[i].caption || data.gallery[i].caption === `Kenangan ${i + 1}`) {
          data.gallery[i].caption = `Kenangan ${i + 1}`;
        }
      }
      Store.saveData(data);
      renderGalleryAdmin();
      showToast(`${selected.length} foto galeri berhasil diupload.`);
    } catch (error) {
      showToast(error.message || 'Upload galeri gagal.');
    } finally {
      event.target.value = '';
      setUploadProgress('');
    }
  }

  function setUploadProgress(message) {
    const box = $('galleryUploadProgress');
    if (!box) return;
    box.textContent = message;
    box.classList.toggle('hidden', !message);
  }

  function clearGalleryPhoto(event) {
    const index = Number(event.currentTarget.dataset.index);
    data.gallery[index].image = '';
    Store.saveData(data);
    renderGalleryAdmin();
    showToast(`Foto galeri ${index + 1} dihapus.`);
  }

  function saveGalleryCaptions() {
    document.querySelectorAll('.gallery-caption').forEach((input) => {
      const index = Number(input.dataset.index);
      data.gallery[index].caption = input.value.trim() || `Kenangan ${index + 1}`;
    });
    Store.saveData(data);
    renderGalleryAdmin();
    showToast('Caption galeri berhasil disimpan.');
  }

  function fillMusicForm() {
    const form = $('musicForm');
    form.elements.musicEnabled.value = String(data.settings.musicEnabled);
    form.elements.musicTitle.value = data.settings.musicTitle || '';
    form.elements.musicVolume.value = String(data.settings.musicVolume ?? 0.35);
    const preview = $('musicPreview');
    if (data.settings.musicUrl) {
      preview.src = data.settings.musicUrl;
      preview.classList.remove('hidden');
    } else {
      preview.removeAttribute('src');
    }
  }

  async function uploadMusic(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await Store.fileToDataURL(file, 20);
      data.settings.musicUrl = dataUrl;
      data.settings.musicTitle = file.name.replace(/\.[^.]+$/, '');
      Store.saveData(data);
      fillMusicForm();
      showToast('Musik berhasil diupload.');
    } catch (error) {
      showToast(error.message);
    } finally {
      event.target.value = '';
    }
  }

  function saveMusicSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    data.settings.musicEnabled = form.elements.musicEnabled.value === 'true';
    data.settings.musicTitle = form.elements.musicTitle.value.trim();
    data.settings.musicVolume = Number(form.elements.musicVolume.value || 0.35);
    Store.saveData(data);
    fillMusicForm();
    showToast('Pengaturan musik berhasil disimpan.');
  }

  function clearMusic() {
    if (!confirm('Hapus file musik?')) return;
    data.settings.musicUrl = '';
    Store.saveData(data);
    fillMusicForm();
    showToast('Musik dihapus.');
  }

  function addGuest(event) {
    event.preventDefault();
    const name = $('guestNameInput').value.trim();
    const phone = $('guestPhoneInput').value.trim();
    if (!name) return;
    const guest = {
      id: Store.cryptoId(),
      name,
      slug: Store.uniqueSlug(name, data.guests),
      phone,
      createdAt: new Date().toISOString()
    };
    data.guests.push(guest);
    Store.saveData(data);
    event.currentTarget.reset();
    renderAll();
    showToast('Tamu berhasil ditambahkan.');
  }

  function invitationLink(slug) {
    const path = window.location.href.replace(/admin\.html.*$/i, 'index.html');
    return `${path}?to=${encodeURIComponent(slug)}`;
  }

  function renderGuestTable() {
    const rows = data.guests.map((guest, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><input class="input table-guest-name" data-id="${guest.id}" value="${Store.escapeHtml(guest.name)}" /></td>
        <td><input class="input table-guest-phone" data-id="${guest.id}" value="${Store.escapeHtml(guest.phone || '')}" /></td>
        <td><code>${guest.slug}</code><br><button class="btn secondary small copy-link" data-slug="${guest.slug}" type="button">Copy Link</button></td>
        <td>
          <button class="btn small save-guest" data-id="${guest.id}" type="button">Simpan</button>
          <button class="btn danger small delete-guest" data-id="${guest.id}" type="button">Hapus</button>
        </td>
      </tr>`).join('');
    $('guestTable').innerHTML = `
      <thead><tr><th>No</th><th>Nama Tamu</th><th>WhatsApp</th><th>Link Personal</th><th>Aksi</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">Belum ada tamu.</td></tr>'}</tbody>`;
    document.querySelectorAll('.copy-link').forEach((btn) => btn.addEventListener('click', copyGuestLink));
    document.querySelectorAll('.save-guest').forEach((btn) => btn.addEventListener('click', saveGuestRow));
    document.querySelectorAll('.delete-guest').forEach((btn) => btn.addEventListener('click', deleteGuest));
  }

  async function copyGuestLink(event) {
    const link = invitationLink(event.currentTarget.dataset.slug);
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link undangan berhasil dicopy.');
    } catch (_) {
      prompt('Copy link undangan:', link);
    }
  }

  function saveGuestRow(event) {
    const id = event.currentTarget.dataset.id;
    const guest = data.guests.find((g) => g.id === id);
    if (!guest) return;
    const name = document.querySelector(`.table-guest-name[data-id="${id}"]`).value.trim();
    const phone = document.querySelector(`.table-guest-phone[data-id="${id}"]`).value.trim();
    guest.name = name;
    guest.phone = phone;
    guest.slug = Store.uniqueSlug(name, data.guests, id);
    Store.saveData(data);
    renderGuestTable();
    showToast('Data tamu berhasil disimpan.');
  }

  function deleteGuest(event) {
    const id = event.currentTarget.dataset.id;
    if (!confirm('Hapus tamu ini?')) return;
    data.guests = data.guests.filter((g) => g.id !== id);
    Store.saveData(data);
    renderAll();
    showToast('Tamu dihapus.');
  }

  async function importGuestsCsv(event) {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    const rows = Store.parseCsv(text).filter((row) => row[0] && row[0].toLowerCase() !== 'nama');
    let count = 0;
    rows.forEach((row) => {
      const name = row[0]?.trim();
      if (!name) return;
      data.guests.push({ id: Store.cryptoId(), name, phone: row[1]?.trim() || '', slug: Store.uniqueSlug(name, data.guests), createdAt: new Date().toISOString() });
      count++;
    });
    Store.saveData(data);
    event.target.value = '';
    renderAll();
    showToast(`${count} tamu berhasil diimport.`);
  }

  function exportGuestsCsv() {
    const rows = [['nama', 'whatsapp', 'slug', 'link']].concat(data.guests.map((g) => [g.name, g.phone || '', g.slug, invitationLink(g.slug)]));
    Store.downloadText('daftar-tamu-telung-oton-kaivan.csv', Store.toCsv(rows), 'text/csv');
  }

  function renderRsvpTable() {
    const rows = data.rsvps.map((item, index) => {
      const date = new Date(item.createdAt);
      const formatted = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
      return `<tr>
        <td>${index + 1}</td>
        <td>${Store.escapeHtml(item.guestName)}</td>
        <td>${Store.escapeHtml(item.status)}</td>
        <td>${Number(item.guestCount || 0)}</td>
        <td>${Store.escapeHtml(item.message)}</td>
        <td>${formatted}</td>
        <td><button class="btn danger small delete-rsvp" data-id="${item.id}" type="button">Hapus</button></td>
      </tr>`;
    }).join('');
    $('rsvpTable').innerHTML = `<thead><tr><th>No</th><th>Nama</th><th>Status</th><th>Jumlah</th><th>Ucapan</th><th>Waktu</th><th>Aksi</th></tr></thead><tbody>${rows || '<tr><td colspan="7">Belum ada RSVP.</td></tr>'}</tbody>`;
    document.querySelectorAll('.delete-rsvp').forEach((btn) => btn.addEventListener('click', deleteRsvp));
  }

  function deleteRsvp(event) {
    if (!confirm('Hapus RSVP/ucapan ini?')) return;
    data.rsvps = data.rsvps.filter((item) => item.id !== event.currentTarget.dataset.id);
    Store.saveData(data);
    renderAll();
    showToast('RSVP dihapus.');
  }

  function exportRsvpCsv() {
    const rows = [['nama', 'status', 'jumlah', 'ucapan', 'waktu']].concat(data.rsvps.map((r) => [r.guestName, r.status, r.guestCount, r.message, r.createdAt]));
    Store.downloadText('rsvp-ucapan-telung-oton-kaivan.csv', Store.toCsv(rows), 'text/csv');
  }

  function clearRsvp() {
    if (!confirm('Hapus semua RSVP dan ucapan?')) return;
    data.rsvps = [];
    Store.saveData(data);
    renderAll();
    showToast('Semua RSVP dihapus.');
  }

  function fillThemeForm() {
    const form = $('themeForm');
    form.elements.goldColor.value = data.settings.goldColor || '#d8b45a';
    form.elements.blackColor.value = data.settings.blackColor || '#080603';
    form.elements.showOrnaments.value = String(data.settings.showOrnaments);
    form.elements.showFrame.value = String(data.settings.showFrame);
  }

  function saveThemeSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    data.settings.goldColor = form.elements.goldColor.value;
    data.settings.blackColor = form.elements.blackColor.value;
    data.settings.showOrnaments = form.elements.showOrnaments.value === 'true';
    data.settings.showFrame = form.elements.showFrame.value === 'true';
    Store.saveData(data);
    showToast('Tema berhasil disimpan.');
  }

  function fillAccountForm() {
    const form = $('accountForm');
    form.elements.adminUsername.value = data.settings.adminUsername || 'admin';
    form.elements.adminPassword.value = data.settings.adminPassword || '';
  }

  function saveAccount(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const user = form.elements.adminUsername.value.trim();
    const pass = form.elements.adminPassword.value;
    if (!user || !pass) return showToast('Username dan password wajib diisi.');
    data.settings.adminUsername = user;
    data.settings.adminPassword = pass;
    Store.saveData(data);
    showToast('Akun admin berhasil diperbarui.');
  }

  function exportJson() {
    Store.downloadText('backup-undangan-telung-oton-kaivan.json', JSON.stringify(data, null, 2), 'application/json');
  }

  async function importJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      Store.saveData(imported);
      data = Store.loadData();
      renderAll();
      showToast('Backup JSON berhasil diimport.');
    } catch (error) {
      showToast('File JSON tidak valid.');
    } finally {
      event.target.value = '';
    }
  }

  function resetAll() {
    if (!confirm('Reset semua data ke default? Tindakan ini tidak dapat dibatalkan kecuali Anda punya backup JSON.')) return;
    data = Store.resetData();
    renderAll();
    showToast('Semua data direset.');
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  init();
})();
