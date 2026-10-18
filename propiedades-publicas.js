
// Catálogo público de Gallegos Fariña con ficha de detalle y galería.
(() => {
  const SUPABASE_URL = 'https://tplzdfbovaghgfvmdreb.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_3WAYTYJXOjEy3Vsstbt24g_WftvW5em';
  const BUCKET = 'propiedades-fotos';

  const $ = id => document.getElementById(id);
  const rentList = $('rentList');
  const saleList = $('saleList');
  const rentEmpty = $('rentEmpty');
  const saleEmpty = $('saleEmpty');

  if (!rentList || !saleList) return;

  const escapeHTML = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

  function getPhotoURL(photo) {
    if (!photo) return '';
    if (/^https?:\/\//i.test(photo)) return photo;
    const path = String(photo).split('/')
      .map(part => encodeURIComponent(part)).join('/');
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  function getPhotos(property) {
    const photos = Array.isArray(property.fotografias) ? property.fotografias : [];
    return photos.map(item => {
      if (typeof item === 'string') return getPhotoURL(item);
      if (item && typeof item === 'object') return getPhotoURL(item.url || item.path || '');
      return '';
    }).filter(Boolean);
  }

  const style = document.createElement('style');
  style.textContent = `
    .gf-detail-overlay{position:fixed;inset:0;z-index:99999;background:rgba(10,18,28,.78);display:none;align-items:center;justify-content:center;padding:18px;overflow:auto}
    .gf-detail-overlay.gf-open{display:flex}
    .gf-detail-dialog{position:relative;background:#fff;color:#1d2935;width:min(900px,100%);max-height:92vh;overflow:auto;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.35)}
    .gf-detail-close{position:sticky;top:10px;float:right;margin:10px 10px 0 0;z-index:3;border:0;border-radius:50%;width:42px;height:42px;background:#172b3d;color:#fff;font-size:28px;line-height:1;cursor:pointer}
    .gf-detail-content{padding:0 24px 26px}
    .gf-detail-mainphoto{position:relative;background:#eef1f4;display:flex;align-items:center;justify-content:center;min-height:220px}
    .gf-detail-mainphoto img{display:block;max-width:100%;width:100%;max-height:55vh;object-fit:contain}
    .gf-photo-nav{position:absolute;top:50%;transform:translateY(-50%);border:0;border-radius:50%;width:42px;height:42px;background:rgba(20,35,48,.82);color:white;font-size:26px;cursor:pointer}
    .gf-photo-prev{left:12px}.gf-photo-next{right:12px}
    .gf-thumbs{display:flex;gap:9px;overflow-x:auto;padding:10px 0 4px}
    .gf-thumbs button{border:2px solid transparent;padding:0;border-radius:8px;background:none;cursor:pointer;flex:0 0 86px;height:66px;overflow:hidden}
    .gf-thumbs button.gf-active{border-color:#b58b50}
    .gf-thumbs img{width:100%;height:100%;object-fit:cover;display:block}
    .gf-detail-tag{display:inline-block;margin-top:20px;background:#f3eee6;color:#795b31;border-radius:30px;padding:6px 12px;font-size:12px;font-weight:700}
    .gf-detail-content h2{font-size:clamp(23px,3vw,32px);line-height:1.2;margin:12px 0}
    .gf-detail-price{font-size:24px;font-weight:800;color:#9b743c;margin:10px 0}
    .gf-detail-location{color:#526171;margin:8px 0 18px}
    .gf-detail-description{white-space:pre-line;line-height:1.65}
    .gf-detail-features{line-height:1.7;white-space:pre-line}
    body.gf-modal-open{overflow:hidden}
    @media(max-width:600px){.gf-detail-overlay{padding:8px}.gf-detail-dialog{max-height:96vh;border-radius:12px}.gf-detail-content{padding:0 16px 20px}.gf-detail-mainphoto img{max-height:42vh}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'gf-detail-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <section class="gf-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="gfDetailTitle">
      <button class="gf-detail-close" type="button" aria-label="Cerrar detalles">&times;</button>
      <div class="gf-detail-content">
        <div class="gf-detail-gallery"></div>
        <span class="gf-detail-tag"></span>
        <h2 id="gfDetailTitle"></h2>
        <p class="gf-detail-price"></p>
        <p class="gf-detail-location"></p>
        <h3>Características</h3>
        <div class="gf-detail-features"></div>
        <div class="gf-detail-description-wrap"><h3>Descripción</h3><div class="gf-detail-description"></div></div>
      </div>
    </section>`;
  document.body.appendChild(overlay);

  const dialog = overlay.querySelector('.gf-detail-dialog');
  const closeButton = overlay.querySelector('.gf-detail-close');
  const gallery = overlay.querySelector('.gf-detail-gallery');
  let currentPhotos = [];
  let currentPhotoIndex = 0;
  let lastFocused = null;

  function showPhoto(index) {
    if (!currentPhotos.length) {
      gallery.innerHTML = '<div class="gf-detail-mainphoto"><p>Esta propiedad no tiene fotografías disponibles.</p></div>';
      return;
    }
    currentPhotoIndex = (index + currentPhotos.length) % currentPhotos.length;
    const src = currentPhotos[currentPhotoIndex];
    const thumbs = currentPhotos.length > 1
      ? `<div class="gf-thumbs">${currentPhotos.map((photo, i) =>
          `<button type="button" data-photo="${i}" class="${i === currentPhotoIndex ? 'gf-active' : ''}" aria-label="Ver fotografía ${i + 1}"><img src="${escapeHTML(photo)}" alt="Fotografía ${i + 1}"></button>`
        ).join('')}</div>`
      : '';
    gallery.innerHTML = `
      <div class="gf-detail-mainphoto">
        <img src="${escapeHTML(src)}" alt="Fotografía ${currentPhotoIndex + 1}">
        ${currentPhotos.length > 1 ? '<button class="gf-photo-nav gf-photo-prev" type="button" aria-label="Fotografía anterior">&#8249;</button><button class="gf-photo-nav gf-photo-next" type="button" aria-label="Fotografía siguiente">&#8250;</button>' : ''}
      </div>${thumbs}`;
    gallery.querySelector('.gf-photo-prev')?.addEventListener('click', () => showPhoto(currentPhotoIndex - 1));
    gallery.querySelector('.gf-photo-next')?.addEventListener('click', () => showPhoto(currentPhotoIndex + 1));
    gallery.querySelectorAll('[data-photo]').forEach(button => {
      button.addEventListener('click', () => showPhoto(Number(button.dataset.photo)));
    });
  }

  function openDetails(property) {
    lastFocused = document.activeElement;
    currentPhotos = getPhotos(property);
    currentPhotoIndex = 0;
    showPhoto(0);
    overlay.querySelector('.gf-detail-tag').textContent =
      `${property.operacion || ''}${property.tipo ? ' · ' + property.tipo : ''}`;
    overlay.querySelector('#gfDetailTitle').textContent = property.titulo || 'Detalle de propiedad';
    overlay.querySelector('.gf-detail-price').textContent = property.precio || '';
    overlay.querySelector('.gf-detail-location').textContent = property.comuna || '';
    const features = Array.isArray(property.caracteristicas)
      ? property.caracteristicas.join(' · ')
      : String(property.caracteristicas ?? '');
    overlay.querySelector('.gf-detail-features').textContent = features || 'No se especificaron características.';
    const description = overlay.querySelector('.gf-detail-description');
    description.textContent = property.descripcion || '';
    overlay.querySelector('.gf-detail-description-wrap').style.display =
      property.descripcion ? '' : 'none';
    overlay.classList.add('gf-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gf-modal-open');
    closeButton.focus();
  }

  function closeDetails() {
    overlay.classList.remove('gf-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gf-modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  closeButton.addEventListener('click', closeDetails);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeDetails();
  });
  dialog.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('keydown', event => {
    if (!overlay.classList.contains('gf-open')) return;
    if (event.key === 'Escape') closeDetails();
    if (event.key === 'ArrowLeft' && currentPhotos.length > 1) showPhoto(currentPhotoIndex - 1);
    if (event.key === 'ArrowRight' && currentPhotos.length > 1) showPhoto(currentPhotoIndex + 1);
  });

  function makeCard(property) {
    const photos = getPhotos(property);
    const firstPhoto = photos[0] || '';
    const details = Array.isArray(property.caracteristicas)
      ? property.caracteristicas.join(' · ')
      : String(property.caracteristicas ?? '');
    const image = firstPhoto
      ? `<img src="${escapeHTML(firstPhoto)}" alt="${escapeHTML(property.titulo)}" loading="lazy">`
      : '';
    return `
      <article class="property gf-clickable" data-property-id="${escapeHTML(property.id)}" tabindex="0" role="button" aria-label="Ver detalles de ${escapeHTML(property.titulo)}">
        ${image}
        <div class="property-body">
          <span class="tag">${escapeHTML(property.operacion)} · ${escapeHTML(property.tipo)}</span>
          <h3>${escapeHTML(property.titulo)}</h3>
          <p>${escapeHTML(property.comuna)}${details ? ' · ' + escapeHTML(details) : ''}</p>
          <p class="price">${escapeHTML(property.precio)}</p>
          ${property.descripcion ? `<p>${escapeHTML(property.descripcion)}</p>` : ''}
          <p class="gf-detail-hint">Ver detalles y fotografías ›</p>
        </div>
      </article>`;
  }

  let allProperties = [];

  function render(properties) {
    const rentals = properties.filter(p => String(p.operacion).toLowerCase() === 'arriendo');
    const sales = properties.filter(p => String(p.operacion).toLowerCase() === 'venta');
    rentList.innerHTML = rentals.map(makeCard).join('');
    saleList.innerHTML = sales.map(makeCard).join('');
    if (rentEmpty) rentEmpty.style.display = rentals.length ? 'none' : '';
    if (saleEmpty) saleEmpty.style.display = sales.length ? 'none' : '';
  }

  function applySearch() {
    const operation = $('operation')?.value || 'Todas';
    const type = $('type')?.value || 'Todas';
    const location = ($('location')?.value || '').trim().toLowerCase();
    render(allProperties.filter(property =>
      (operation === 'Todas' || property.operacion === operation) &&
      (type === 'Todas' || property.tipo === type) &&
      (!location || String(property.comuna || '').toLowerCase().includes(location))
    ));
    if (operation === 'Venta') $('ventas')?.scrollIntoView({ behavior: 'smooth' });
    else if (operation === 'Arriendo') $('arriendos')?.scrollIntoView({ behavior: 'smooth' });
  }

  function openCard(event) {
    const card = event.target.closest('.gf-clickable');
    if (!card) return;
    const property = allProperties.find(item => String(item.id) === card.dataset.propertyId);
    if (property) openDetails(property);
  }

  rentList.addEventListener('click', openCard);
  saleList.addEventListener('click', openCard);
  [rentList, saleList].forEach(list => list.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.gf-clickable')) {
      event.preventDefault();
      const property = allProperties.find(item => String(item.id) === event.target.dataset.propertyId);
      if (property) openDetails(property);
    }
  }));

  const form = $('searchForm');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    applySearch();
  });

  async function loadProperties() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/propiedades?select=id,titulo,operacion,tipo,comuna,precio,caracteristicas,descripcion,fotografias,publicada,created_at&publicada=eq.true&order=created_at.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' } }
      );
      if (!response.ok) throw new Error(`Error de Supabase: ${response.status}`);
      allProperties = await response.json();
      render(allProperties);
    } catch (error) {
      console.error('No se pudieron cargar las propiedades:', error);
      [rentEmpty, saleEmpty].filter(Boolean).forEach(el => {
        el.style.display = 'block';
        el.textContent = 'No se pudieron cargar las propiedades. Inténtalo de nuevo más tarde.';
      });
    }
  }

  loadProperties();
})();
