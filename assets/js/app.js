(function () {
  const Store = window.BaliInviteStore;
  let data;
  let settings;
  let guest;
  let slideIndex = 0;
  let countdownTimer;
  let galleryTimer;
  let touchStartX = 0;
  const AUTO_SLIDE_MS = 4200;

  const $ = (id) => document.getElementById(id);

  async function init() {
    await Store.ready();
    data = Store.loadData();
    settings = data.settings;
    guest = Store.getGuestFromQuery(data);
    applyTheme();
    renderCover();
    renderMain();
    renderMap();
    renderGallery();
    renderWishes();
    setupMusic();
    bindEvents();
    startCountdown();
  }

  function applyTheme() {
    document.documentElement.style.setProperty('--gold', settings.goldColor || '#d8b45a');
    document.documentElement.style.setProperty('--gold-soft', lightenGold(settings.goldColor || '#d8b45a'));
    document.documentElement.style.setProperty('--black', settings.blackColor || '#080603');
    document.documentElement.style.setProperty('--font-title', '"Cormorant Garamond", Georgia, serif');
    document.documentElement.style.setProperty('--font-body', '"Plus Jakarta Sans", "Segoe UI", sans-serif');
    document.querySelectorAll('.bali-ornament, .wayang-mark').forEach((el) => {
      el.classList.toggle('hidden', !settings.showOrnaments);
    });
  }

  function lightenGold(color) {
    if (!color || !/^#([0-9a-f]{6})$/i.test(color)) return '#f4df9c';
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 255) + 48);
    const g = Math.min(255, ((num >> 8) & 255) + 40);
    const b = Math.min(255, (num & 255) + 35);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function renderCover() {
    $('guestName').textContent = guest.name || 'Bapak/Ibu/Saudara/i';
    $('coverTitle').textContent = settings.invitationTitle;
    $('coverSubtitle').textContent = settings.subheader;
    document.title = settings.invitationTitle;
  }

  function renderMain() {
    $('heroChildName').textContent = settings.childName || 'Kaivan';
    $('openingText').textContent = settings.openingText || '';
    $('detailEventTitle').textContent = settings.eventTitle || settings.invitationTitle;
    $('detailDate').textContent = Store.formatDate(settings.eventDate);
    $('detailTime').textContent = `${settings.eventTime || '-'} ${settings.timezoneLabel || ''}`.trim();
    $('detailLocation').textContent = settings.locationName || '-';
    $('addressText').textContent = `${settings.locationName || ''}\n${settings.address || ''}`.trim();
    $('closingText').textContent = settings.closingText || '';
    $('countdownCard').classList.toggle('hidden', !settings.countdownEnabled);
    $('mainPhotoFrame').style.display = settings.showFrame ? '' : 'contents';
    $('rsvpName').value = guest.name || 'Bapak/Ibu/Saudara/i';

    const box = $('mainPhotoBox');
    if (settings.mainPhoto) {
      box.innerHTML = `<img src="${settings.mainPhoto}" alt="Foto utama ${Store.escapeHtml(settings.childName)}" />`;
    } else {
      box.innerHTML = '<div>Upload foto utama melalui <strong>admin.html</strong></div>';
    }
  }

  function getMapEmbedUrl() {
    if (settings.mapsEmbedUrl && settings.mapsEmbedUrl.trim()) return settings.mapsEmbedUrl.trim();
    const query = settings.address || settings.locationName || 'Bali';
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  }

  function renderMap() {
    const iframe = `<iframe title="Lokasi Acara" loading="lazy" src="${getMapEmbedUrl()}" allowfullscreen></iframe>`;
    $('mapPreview').innerHTML = iframe;
    $('mapModalContent').innerHTML = iframe;
    const external = settings.mapsUrl && settings.mapsUrl.trim() ? settings.mapsUrl.trim() : `https://maps.google.com/?q=${encodeURIComponent(settings.address || settings.locationName || 'Bali')}`;
    $('mapsExternal').href = external;
    $('mapsExternalModal').href = external;

    const wa = formatWhatsAppUrl();
    $('whatsappBtn').classList.toggle('hidden', !wa);
    if (wa) $('whatsappBtn').href = wa;
  }

  function formatWhatsAppUrl() {
    const raw = settings.whatsappNumber || '';
    const clean = raw.replace(/[^0-9]/g, '');
    if (!clean) return '';
    const number = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
    const text = `Om Swastiastu, saya ${guest.name || ''} ingin konfirmasi undangan ${settings.invitationTitle}.`;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    if (!settings.countdownEnabled) return;
    const target = new Date(`${settings.eventDate || ''}T${settings.eventTime || '00:00'}:00`);
    function tick() {
      const now = new Date();
      let diff = target.getTime() - now.getTime();
      if (Number.isNaN(diff)) diff = 0;
      if (diff < 0) diff = 0;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      $('cdDays').textContent = String(days).padStart(2, '0');
      $('cdHours').textContent = String(hours).padStart(2, '0');
      $('cdMinutes').textContent = String(minutes).padStart(2, '0');
      $('cdSeconds').textContent = String(seconds).padStart(2, '0');
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function setupMusic() {
    const audio = $('bgMusic');
    const toggle = $('musicToggle');
    toggle.classList.toggle('hidden', !settings.musicEnabled);
    if (!settings.musicEnabled || !settings.musicUrl) {
      toggle.textContent = '♪';
      audio.removeAttribute('src');
      return;
    }
    audio.src = settings.musicUrl;
    audio.volume = Number(settings.musicVolume ?? 0.35);
    toggle.title = settings.musicTitle || 'Musik undangan';
  }

  function playMusic() {
    const audio = $('bgMusic');
    if (!settings.musicEnabled || !settings.musicUrl) return;
    audio.play().then(() => {
      $('musicToggle').textContent = '❚❚';
    }).catch(() => {
      $('musicToggle').textContent = '♪';
    });
  }

  function bindEvents() {
    $('openInvitation').addEventListener('click', () => {
      $('utama').scrollIntoView({ behavior: 'smooth' });
      playMusic();
    });
    $('musicToggle').addEventListener('click', () => {
      const audio = $('bgMusic');
      if (!settings.musicUrl) return showToast('Musik belum diupload di admin.');
      if (audio.paused) playMusic();
      else {
        audio.pause();
        $('musicToggle').textContent = '♪';
      }
    });
    $('openMapBtn').addEventListener('click', () => openModal('mapModal'));
    $('openGalleryBtn').addEventListener('click', () => openGallery(0));
    $('openGalleryBtn2').addEventListener('click', () => openGallery(0));
    $('prevSlide').addEventListener('click', () => {
      changeSlide(-1);
      restartGalleryAutoplay();
    });
    $('nextSlide').addEventListener('click', () => {
      changeSlide(1);
      restartGalleryAutoplay();
    });
    document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
    document.querySelectorAll('.modal').forEach((modal) => modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal.id);
    }));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') document.querySelectorAll('.modal.open').forEach((modal) => closeModal(modal.id));
      if ($('galleryModal').classList.contains('open') && event.key === 'ArrowRight') {
        changeSlide(1);
        restartGalleryAutoplay();
      }
      if ($('galleryModal').classList.contains('open') && event.key === 'ArrowLeft') {
        changeSlide(-1);
        restartGalleryAutoplay();
      }
    });
    $('rsvpForm').addEventListener('submit', submitRsvp);

    const slider = $('sliderFrame');
    slider.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });
    slider.addEventListener('touchend', (event) => {
      const endX = event.changedTouches[0].screenX;
      const diff = endX - touchStartX;
      if (Math.abs(diff) > 45) {
        changeSlide(diff < 0 ? 1 : -1);
        restartGalleryAutoplay();
      }
    }, { passive: true });
    slider.addEventListener('mouseenter', stopGalleryAutoplay);
    slider.addEventListener('mouseleave', () => {
      if ($('galleryModal').classList.contains('open')) startGalleryAutoplay();
    });
  }

  function openModal(id) {
    $(id).classList.add('open');
    $(id).setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    if (id === 'galleryModal') startGalleryAutoplay();
  }

  function closeModal(id) {
    $(id).classList.remove('open');
    $(id).setAttribute('aria-hidden', 'true');
    if (id === 'galleryModal') stopGalleryAutoplay();
    if (!document.querySelector('.modal.open')) document.body.classList.remove('no-scroll');
  }

  function renderGallery() {
    const strip = $('galleryStrip');
    strip.innerHTML = '';
    data.gallery.forEach((item, index) => {
      const button = document.createElement('button');
      button.className = 'gallery-thumb';
      button.type = 'button';
      button.innerHTML = item.image
        ? `<img src="${item.image}" alt="${Store.escapeHtml(item.caption)}" /><span class="thumb-overlay">${Store.escapeHtml(item.caption || `Kenangan ${index + 1}`)}</span>`
        : `<span>Foto ${index + 1}</span>`;
      button.addEventListener('click', () => openGallery(index));
      strip.appendChild(button);
    });
  }

  function openGallery(index) {
    slideIndex = Number(index) || 0;
    renderSlide();
    openModal('galleryModal');
  }

  function changeSlide(delta) {
    const total = data.gallery.length || 1;
    slideIndex = (slideIndex + delta + total) % total;
    renderSlide();
  }

  function startGalleryAutoplay() {
    stopGalleryAutoplay();
    galleryTimer = setInterval(() => {
      if ($('galleryModal').classList.contains('open')) changeSlide(1);
    }, AUTO_SLIDE_MS);
  }

  function stopGalleryAutoplay() {
    clearInterval(galleryTimer);
    galleryTimer = null;
  }

  function restartGalleryAutoplay() {
    if ($('galleryModal').classList.contains('open')) startGalleryAutoplay();
  }

  function renderSlide() {
    const item = data.gallery[slideIndex];
    const frame = $('sliderFrame');
    if (item && item.image) {
      frame.innerHTML = `
        <div class="slider-shell">
          <span class="autoplay-badge">Otomatis Bergerak</span>
          <div class="slider-image-wrap">
            <img class="slider-photo" src="${item.image}" alt="${Store.escapeHtml(item.caption)}">
          </div>
          <div class="slider-caption-panel">
            <div class="slider-count">${slideIndex + 1} / ${data.gallery.length}</div>
            <p class="slider-caption">${Store.escapeHtml(item.caption || `Kenangan ${slideIndex + 1}`)}</p>
          </div>
        </div>`;
    } else {
      frame.innerHTML = `<div class="slider-empty">Foto ${slideIndex + 1} belum diupload melalui admin panel.</div>`;
    }
    const dots = $('sliderDots');
    dots.innerHTML = '';
    data.gallery.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `dot ${index === slideIndex ? 'active' : ''}`;
      dot.type = 'button';
      dot.setAttribute('aria-label', `Slide ${index + 1}`);
      dot.addEventListener('click', () => {
        slideIndex = index;
        renderSlide();
        restartGalleryAutoplay();
      });
      dots.appendChild(dot);
    });
  }

  function submitRsvp(event) {
    event.preventDefault();
    data = Store.loadData();
    const guestName = $('rsvpName').value.trim() || guest.name || 'Tamu Undangan';
    const status = document.querySelector('input[name="attendance"]:checked')?.value || 'Hadir';
    const guestCount = Number($('guestCount').value || 0);
    const message = $('wishMessage').value.trim();
    if (!message) return showToast('Mohon isi ucapan dan doa terlebih dahulu.');

    const entry = {
      id: Store.cryptoId(),
      guestId: guest.id || '',
      guestName,
      status,
      guestCount,
      message,
      createdAt: new Date().toISOString()
    };
    data.rsvps.unshift(entry);
    Store.saveData(data);
    $('rsvpForm').reset();
    $('rsvpName').value = guest.name || guestName;
    $('guestCount').value = '1';
    document.querySelector('input[name="attendance"][value="Hadir"]').checked = true;
    renderWishes();
    showToast('Ucapan dan konfirmasi berhasil dikirim.');
  }

  function renderWishes() {
    data = Store.loadData();
    const wrap = $('wishesList');
    if (!data.rsvps.length) {
      wrap.innerHTML = '<div class="wish-card"><strong>Belum ada ucapan</strong><p>Ucapan dan doa dari tamu akan tampil di sini.</p></div>';
      return;
    }
    wrap.innerHTML = data.rsvps.slice(0, 50).map((item) => `
      <div class="wish-card">
        <strong>${Store.escapeHtml(item.guestName)}</strong>
        <p>${Store.escapeHtml(item.message)}</p>
        <div class="wish-meta">${Store.escapeHtml(item.status)} • ${Number(item.guestCount || 0)} tamu • ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt))}</div>
      </div>`).join('');
  }

  let toastTimer;
  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  init();
})();
