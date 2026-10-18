
 // Catálogo público de Gallegos Fariña conectado a Supabase.
(async function () {
  const URL = 'https://tplzdfbovaghgfvmdreb.supabase.co';
  const KEY = 'sb_publishable_3WAYTYJXOjEy3Vsstbt24g_WftvW5em';
  const BUCKET = 'propiedades-fotos';

  const rent = document.getElementById('rentList');
  const sale = document.getElementById('saleList');
  const rentEmpty = document.getElementById('rentEmpty');
  const saleEmpty = document.getElementById('saleEmpty');
  if (!rent || !sale) return;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const photoUrl = path => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${URL}/storage/v1/object/public/${BUCKET}/${String(path).split('/').map(encodeURIComponent).join('/')}`;
  };

  const photosOf = p => (Array.isArray(p.fotografias) ? p.fotografias : [])
    .map(photoUrl).filter(Boolean);

  const characteristics = p => {
    if (Array.isArray(p.caracteristicas)) return p.caracteristicas.join(' · ');
    if (p.caracteristicas && typeof p.caracteristicas === 'object')
      return Object.entries(p.caracteristicas)
        .map(([k,v]) => `${k}: ${v}`).join(' · ');
    return String(p.caracteristicas ?? '');
  };

  // Estilos de la ficha: no requiere modificar index.html.
  const style = document.createElement('style');
  style.textContent = `
    .property { cursor:pointer; }
    .property:focus-visible { outline:3px solid #ad8b55; outline-offset:4px; }
    .property img { cursor:pointer; }
    .gf-modal { position:fixed; inset:0; z-index:99999; background:rgba(12,20,28,.78);
      display:flex; align-items:center; justify-content:center; padding:20px; overflow-y:auto; }
    .gf-dialog { background:#fff; color:#25313b; width:min(100%,900px); max-height:92vh;
      overflow-y:auto; border-radius:12px; position:relative; padding:24px; }
    .gf-close { position:sticky; float:right; top:0; z-index:2; border:0; border-radius:50%;
      width:42px; height:42px; font-size:26px; cursor:pointer; background:#edf0f2; }
    .gf-main-photo { width:100%; height: min(52vh,480px); object-fit:contain; background:#f0f1f2; border-radius:8px; }
    .gf-gallery-controls { display:flex; align-items:center; justify-content:center; gap:16px; padding:12px; }
    .gf-gallery-controls button { padding:8px 16px; cursor:pointer; }
    .gf-thumbs { display:flex; gap:8px; overflow-x:auto; padding:8px 0 16px; }
    .gf-thumbs img { width:90px; height:65px; object-fit:cover; cursor:pointer; border-radius:5px; }
    .gf-thumbs img.active { outline:3px solid #ad8b55; }
    .gf-details { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:10px; margin:18px 0; }
    .gf-detail { background:#f4f5f6; padding:12px; border-radius:7px; overflow-wrap:anywhere; }
    .gf-detail strong { display:block; font-size:12px; color:#66717a; margin-bottom:5px; }
    .gf-modal h2 { margin:12px 0; }
    .gf-description { white-space:pre-wrap; line-height:1.6; }
    @media(max-width:600px) { .gf-modal {padding:8px;} .gf-dialog {padding:14px;max-height:96vh;} }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'gf-modal';
  modal.hidden = true;
  modal.innerHTML = `<section class="gf-dialog" role="dialog" aria-modal="true" aria-label="Detalle de propiedad">
    <button type="button" class="gf-close" aria-label="Cerrar">×</button>
    <div id="gf-content"></div>
  </section>`;
  document.body.appendChild(modal);

  const content = modal.querySelector('#gf-content');
  const closeButton = modal.querySelector('.gf-close');
  let previousFocus = null;
  let currentPhotos = [];
  let currentIndex = 0;

  function showPhoto(index) {
    if (!currentPhotos.length) return;
    currentIndex = (index + currentPhotos.length) % currentPhotos.length;
    const main = content.querySelector('.gf-main-photo');
    if (main) {
      main.src = currentPhotos[currentIndex];
      main.alt = `Fotografía ${currentIndex + 1}`;
    }
    const count = content.querySelector('.gf-photo-count');
    if (count) count.textContent = `${currentIndex + 1} de ${currentPhotos.length}`;
    content.querySelectorAll('.gf-thumbs img').forEach((img, i) =>
      img.classList.toggle('active', i === currentIndex));
  }

  function openProperty(p) {
    previousFocus = document.activeElement;
    currentPhotos = photosOf(p);
    currentIndex = 0;
    const details = characteristics(p);
    const photoMarkup = currentPhotos.length
      ? `<img class="gf-main-photo" src="${esc(currentPhotos[0])}" alt="Fotografía principal">`
      : `<div class="gf-main-photo" style="display:grid;place-items:center">Sin fotografías disponibles</div>`;

    const thumbs = currentPhotos.length > 1
      ? `<div class="gf-thumbs">${currentPhotos.map((src,i =>
          `<img src="${esc(src)}" alt="Ver fotografía ${i+1}" data-photo="${i}" class="${i===0?'active':''}">`
        ).join('')}</div>`
      : '';

    content.innerHTML = `
      <span>${esc(p.operacion)} · ${esc(p.tipo)}</span>
      <h2>${esc(p.titulo)}</h2>
      ${photoMarkup}
      ${currentPhotos.length > 1 ? `<div class="gf-gallery-controls">
        <button type="button" id="gf-prev">← Anterior</button>
        <span class="gf-photo-count">1 de ${currentPhotos.length}</span>
        <button type="button" id="gf-next">Siguiente →</button>
      </div>${thumbs}` : ''}
      <div class="gf-details">
        <div class="gf-detail"><strong>Precio</strong>${esc(p.precio || 'Consultar')}</div>
        <div class="gf-detail"><strong>Ubicación</strong>${esc(p.comuna || 'No especificada')}</div>
        <div class="gf-detail"><strong>Operación</strong>${esc(p.operacion || 'No especificada')}</div>
        <div class="gf-detail"><strong>Tipo</strong>${esc(p.tipo || 'No especificado')}</div>
      </div>
      ${details ? `<h3>Características</h3><p class="gf-description">${esc(details)}</p>` : ''}
      ${p.descripcion ? `<h3>Descripción</h3><p class="gf-description">${esc(p.descripcion)}</p>` : ''}
    `;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeButton.focus();

    content.querySelector('#gf-prev')?.addEventListener('click', () => showPhoto(currentIndex - 1));
    content.querySelector('#gf-next')?.addEventListener('click', () => showPhoto(currentIndex + 1));
    content.querySelectorAll('.gf-thumbs img').forEach(img =>
      img.addEventListener('click', () => showPhoto(Number(img.dataset.photo))));
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    previousFocus?.focus?.();
  }

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') showPhoto(currentIndex + 1);
    if (e.key === 'ArrowLeft') showPhoto(currentIndex - 1);
  });

  function card(p) {
    const photos = photosOf(p);
    const photo = photos[0] || '';
    const details = characteristics(p);
    return `<article class="property" tabindex="0" role="button" aria-label="Ver detalles de ${esc(p.titulo)}" data-property-id="${esc(p.id)}">
      ${photo ? `<img src="${esc(photo)}" alt="${esc(p.titulo)}" loading="lazy">` : ''}
      <div class="property-body">
        <span class="tag">${esc(p.operacion)} · ${esc(p.tipo)}</span>
        <h3>${esc(p.titulo)}</h3>
        <p>${esc(p.comuna)}${details ? ' · ' + esc(details) : ''}</p>
        <p class="price">${esc(p.precio)}</p>
        ${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}
        <p><strong>Ver propiedad y fotografías →</strong></p>
      </div></article>`;
  }

  let allRows = [];

  function display(rows) {
    const rentals = rows.filter(p => String(p.operacion).toLowerCase() === 'arriendo');
    const sales = rows.filter(p => String(p.operacion).toLowerCase() === 'venta');
    rent.innerHTML = rentals.map(card).join('');
    sale.innerHTML = sales.map(card).join('');
    if (rentEmpty) rentEmpty.style.display = rentals.length ? 'none' : 'block';
    if (saleEmpty) saleEmpty.style.display = sales.length ? 'none' : 'block';
  }

  function bindCards() {
    document.querySelectorAll('.property[data-property-id]').forEach(el => {
      const p = allRows.find(row => String(row.id) === el.dataset.propertyId);
      if (!p) return;
      el.addEventListener('click', () => openProperty(p));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProperty(p);
        }
      });
    });
  }

  try {
    const response = await fetch(`${URL}/rest/v1/propiedades?select=id,titulo,operacion,tipo,comuna,precio,caracteristicas,descripcion,fotografias,publicada,created_at&publicada=eq.true&order=created_at.desc`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    allRows = await response.json();
    display(allRows);
    bindCards();

    const form = document.getElementById('searchForm');
    if (form) form.addEventListener('submit', event => {
      event.preventDefault();
      const op = document.getElementById('operation').value;
      const type = document.getElementById('type').value;
      const loc = document.getElementById('location').value.trim().toLowerCase();
      const filtered = allRows.filter(p =>
        (op === 'Todas' || p.operacion === op) &&
        (type === 'Todas' || p.tipo === type) &&
        (!loc || String(p.comuna ?? '').toLowerCase().includes(loc))
      );
      display(filtered);
      bindCards();
      document.getElementById(op === 'Venta' ? 'ventas' : 'arriendos')
        ?.scrollIntoView({behavior:'smooth'});
    });
  } catch (error) {
    console.error('Error cargando propiedades desde Supabase:', error);
    [rentEmpty, saleEmpty].filter(Boolean).forEach(el => {
      el.style.display = 'block';
      const msg = document.createElement('p');
      msg.textContent = 'No se pudieron cargar las propiedades. Inténtalo de nuevo más tarde.';
      msg.className = 'catalog-error';
      el.appendChild(msg);
    });
  }
})();
