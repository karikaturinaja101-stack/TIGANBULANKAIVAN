(function () {
  const STORAGE_KEY = 'telung_oton_kaivan_v2';
  const LEGACY_STORAGE_KEY = 'telung_oton_kaivan_v1';
  const SESSION_KEY = 'telung_oton_admin_session';

  const gold = '#d8b45a';
  const black = '#080603';

  const defaultData = {
    settings: {
      invitationTitle: '3 Bulanan / Telung Oton Kaivan',
      eventTitle: 'Upacara 3 Bulanan / Telung Oton',
      childName: 'Kaivan',
      subheader: 'Putra dari Pasangan Jodie & Citra',
      fatherName: 'Jodie',
      motherName: 'Citra',
      eventDate: '2026-07-20',
      eventTime: '10:00',
      timezoneLabel: 'WITA',
      locationName: 'Kediaman Keluarga Besar',
      address: 'Silakan ubah alamat acara pada halaman admin.',
      mapsUrl: 'https://maps.google.com',
      mapsEmbedUrl: '',
      whatsappNumber: '',
      openingText: 'Atas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa, dengan penuh rasa syukur kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara 3 Bulanan / Telung Oton putra kami.',
      closingText: 'Merupakan kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
      mainPhoto: '',
      musicUrl: '',
      musicTitle: 'Gamelan Bali Lembut',
      musicEnabled: true,
      musicVolume: 0.35,
      countdownEnabled: true,
      showOrnaments: true,
      showFrame: true,
      goldColor: gold,
      blackColor: black,
      adminUsername: 'admin',
      adminPassword: 'admin123'
    },
    guests: [
      { id: cryptoId(), name: 'Bapak/Ibu/Saudara/i', slug: 'tamu-undangan', phone: '', createdAt: new Date().toISOString() },
      { id: cryptoId(), name: 'Keluarga Besar', slug: 'keluarga-besar', phone: '', createdAt: new Date().toISOString() }
    ],
    gallery: Array.from({ length: 8 }, (_, i) => ({
      id: cryptoId(),
      image: '',
      caption: `Kenangan ${i + 1}`,
      sortOrder: i + 1
    })),
    rsvps: []
  };

  let supabaseClient = null;
  let readyPromise = null;
  let remoteSaveTimer = null;
  let lastSyncStatus = 'local';

  function cryptoId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getConfig() {
    return window.SUPABASE_CONFIG || {};
  }

  function isSupabaseConfigured() {
    const cfg = getConfig();
    return Boolean(
      cfg.enabled &&
      cfg.url &&
      cfg.anonKey &&
      !String(cfg.url).includes('PASTE_') &&
      !String(cfg.anonKey).includes('PASTE_') &&
      /^https:\/\/.+\.supabase\.co/i.test(String(cfg.url)) &&
      String(cfg.anonKey).length > 40
    );
  }

  function getSupabaseClient() {
    if (!isSupabaseConfigured()) return null;
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('Supabase library belum termuat. Aplikasi berjalan dalam mode lokal.');
      lastSyncStatus = 'local-cdn-missing';
      return null;
    }
    if (!supabaseClient) {
      supabaseClient = window.supabase.createClient(getConfig().url, getConfig().anonKey);
    }
    return supabaseClient;
  }

  function localRaw() {
    return localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  }

  function loadData() {
    try {
      const raw = localRaw();
      if (!raw) {
        const init = deepClone(defaultData);
        saveLocal(init);
        return init;
      }
      const parsed = JSON.parse(raw);
      return mergeDefaults(parsed, false);
    } catch (error) {
      console.warn('Gagal membaca data lokal, memakai default:', error);
      const init = deepClone(defaultData);
      saveLocal(init);
      return init;
    }
  }

  function saveLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function mergeDefaults(data, shouldSave = true) {
    const merged = deepClone(defaultData);
    merged.settings = { ...merged.settings, ...(data.settings || {}) };
    merged.guests = Array.isArray(data.guests) ? data.guests : merged.guests;
    merged.gallery = Array.isArray(data.gallery) && data.gallery.length ? data.gallery : merged.gallery;
    merged.rsvps = Array.isArray(data.rsvps) ? data.rsvps : [];

    while (merged.gallery.length < 8) {
      merged.gallery.push({ id: cryptoId(), image: '', caption: `Kenangan ${merged.gallery.length + 1}`, sortOrder: merged.gallery.length + 1 });
    }

    merged.gallery = merged.gallery.slice(0, 8).map((item, index) => ({
      id: item.id || cryptoId(),
      image: item.image || item.image_url || '',
      caption: item.caption || `Kenangan ${index + 1}`,
      sortOrder: item.sortOrder || item.sort_order || index + 1
    }));

    if (shouldSave) saveData(merged);
    return merged;
  }

  function saveData(data) {
    saveLocal(data);
    queueRemoteSave(data);
  }

  function resetData() {
    const init = deepClone(defaultData);
    saveData(init);
    return init;
  }

  async function ready() {
    if (!readyPromise) readyPromise = initCloud();
    return readyPromise;
  }

  async function initCloud() {
    const client = getSupabaseClient();
    if (!client) return { mode: 'local' };

    const cfg = getConfig();
    const table = cfg.dataTable || 'app_data';
    const dataId = cfg.dataId || 'main';

    try {
      const { data: row, error } = await client
        .from(table)
        .select('data, updated_at')
        .eq('id', dataId)
        .maybeSingle();

      if (error) throw error;

      if (row && row.data) {
        const merged = mergeDefaults(row.data, false);
        saveLocal(merged);
        lastSyncStatus = 'cloud-loaded';
        return { mode: 'cloud', status: 'loaded' };
      }

      const current = loadData();
      const { error: upsertError } = await client
        .from(table)
        .upsert({ id: dataId, data: current, updated_at: new Date().toISOString() }, { onConflict: 'id' });

      if (upsertError) throw upsertError;
      lastSyncStatus = 'cloud-created';
      return { mode: 'cloud', status: 'created' };
    } catch (error) {
      console.warn('Gagal sinkron Supabase, memakai data lokal:', error);
      lastSyncStatus = 'cloud-error';
      return { mode: 'local', error };
    }
  }

  function queueRemoteSave(data) {
    const client = getSupabaseClient();
    if (!client) return;

    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = setTimeout(async () => {
      try {
        const cfg = getConfig();
        const table = cfg.dataTable || 'app_data';
        const dataId = cfg.dataId || 'main';
        const { error } = await client
          .from(table)
          .upsert({ id: dataId, data, updated_at: new Date().toISOString() }, { onConflict: 'id' });

        if (error) throw error;
        lastSyncStatus = 'cloud-saved';
      } catch (error) {
        lastSyncStatus = 'cloud-save-error';
        console.warn('Gagal menyimpan ke Supabase:', error);
      }
    }, 450);
  }

  async function syncNow() {
    const data = loadData();
    const client = getSupabaseClient();
    if (!client) return { ok: false, mode: 'local' };

    try {
      const cfg = getConfig();
      const table = cfg.dataTable || 'app_data';
      const dataId = cfg.dataId || 'main';
      const { error } = await client
        .from(table)
        .upsert({ id: dataId, data, updated_at: new Date().toISOString() }, { onConflict: 'id' });

      if (error) throw error;
      lastSyncStatus = 'cloud-saved';
      return { ok: true, mode: 'cloud' };
    } catch (error) {
      lastSyncStatus = 'cloud-save-error';
      return { ok: false, mode: 'cloud', error };
    }
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 70) || 'tamu-undangan';
  }

  function uniqueSlug(base, guests, currentId) {
    let slug = slugify(base);
    let candidate = slug;
    let counter = 2;
    while (guests.some((g) => g.slug === candidate && g.id !== currentId)) {
      candidate = `${slug}-${counter++}`;
    }
    return candidate;
  }

  function getGuestFromQuery(data) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('to') || params.get('guest') || params.get('tamu') || '';
    const found = data.guests.find((guest) => guest.slug === slug || guest.id === slug);
    return found || { id: '', name: 'Bapak/Ibu/Saudara/i', slug: '', phone: '' };
  }

  function normalizeExtension(file) {
    const fromName = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fromName) return fromName;
    if (file.type === 'image/jpeg') return 'jpg';
    if (file.type === 'image/png') return 'png';
    if (file.type === 'image/webp') return 'webp';
    if (file.type === 'audio/mpeg') return 'mp3';
    if (file.type === 'audio/ogg') return 'ogg';
    if (file.type === 'audio/wav') return 'wav';
    return 'file';
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsDataURL(file);
    });
  }

  async function compressImageForLocal(file, options = {}) {
    const maxWidth = options.maxWidth || 1400;
    const maxHeight = options.maxHeight || 1400;
    const targetBytes = options.targetBytes || 420 * 1024;

    const originalDataUrl = await readFileAsDataURL(file);
    if (file.size <= targetBytes) return originalDataUrl;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.78;
        let output = canvas.toDataURL('image/jpeg', quality);
        while (output.length * 0.75 > targetBytes && quality > 0.46) {
          quality -= 0.08;
          output = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(output);
      };
      img.onerror = () => resolve(originalDataUrl);
      img.src = originalDataUrl;
    });
  }

  async function uploadToSupabaseStorage(file, maxSizeMb = 10) {
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`Ukuran file terlalu besar. Maksimal ${maxSizeMb} MB.`);
    }

    const client = getSupabaseClient();
    if (!client) return '';

    const cfg = getConfig();
    const bucket = cfg.storageBucket || 'kaivan-media';
    const ext = normalizeExtension(file);
    const folder = file.type.startsWith('audio/') ? 'music' : 'images';
    const safeName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'upload';
    const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${cryptoId().slice(0, 8)}-${safeName}.${ext}`;

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined
      });

    if (uploadError) throw new Error(`Upload Supabase gagal: ${uploadError.message}`);

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function fileToDataURL(file, maxSizeMb = 10) {
    if (!file) return '';

    const client = getSupabaseClient();
    if (client) {
      return uploadToSupabaseStorage(file, maxSizeMb);
    }

    if (file.type && file.type.startsWith('image/')) {
      // Mode lokal memakai localStorage. Foto otomatis dikompresi agar 8 foto galeri tetap bisa disimpan.
      return compressImageForLocal(file);
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`Ukuran file terlalu besar. Maksimal ${maxSizeMb} MB.`);
    }
    return readFileAsDataURL(file);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function toCsv(rows) {
    return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  function downloadText(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text) {
    const rows = [];
    let current = '';
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (current || row.length) {
          row.push(current.trim());
          rows.push(row);
          row = [];
          current = '';
        }
        if (char === '\r' && next === '\n') i++;
      } else {
        current += char;
      }
    }
    if (current || row.length) {
      row.push(current.trim());
      rows.push(row);
    }
    return rows;
  }

  function getSyncStatus() {
    return {
      configured: isSupabaseConfigured(),
      status: lastSyncStatus,
      bucket: getConfig().storageBucket || 'kaivan-media',
      table: getConfig().dataTable || 'app_data'
    };
  }

  window.BaliInviteStore = {
    STORAGE_KEY,
    SESSION_KEY,
    ready,
    loadData,
    saveData,
    resetData,
    syncNow,
    getSyncStatus,
    slugify,
    uniqueSlug,
    getGuestFromQuery,
    fileToDataURL,
    formatDate,
    escapeHtml,
    toCsv,
    downloadText,
    parseCsv,
    cryptoId
  };
})();
