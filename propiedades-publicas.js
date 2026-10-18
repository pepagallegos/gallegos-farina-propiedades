
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
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  function getPhotoURL(photo) {
    if (!photo) return '';
    if (/^https?:\/\//i.test(photo)) return photo;

    const path = String(photo).split('/')
      .map(part => encodeURIComponent(part)).join('/');

    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  function makeCard(property) {
    const photos = Array.isArray(property.fotografias)
      ? property.fotografias : [];

    const firstPhoto = photos.length
      ? (typeof photos[0] === 'string'
          ? photos[0]
          : photos[0]?.url || photos[0]?.path || '')
      : '';

    const details = Array.isArray(property.caracteristicas)
      ? property.caracteristicas.join(' · ')
      : String(property.caracteristicas || '');

    const image = firstPhoto
      ? `<img src="${escapeHTML(getPhotoURL(firstPhoto))}"
           alt="${escapeHTML(property.titulo)}" loading="lazy">`
      : '';

    return `
      <article class="property">
        ${image}
        <div class="property-body">
          <span class="tag">${escapeHTML(property.operacion)} · ${escapeHTML(property.tipo)}</span>
          <h3>${escapeHTML(property.titulo)}</h3>
          <p>${escapeHTML(property.comuna)}${details ? ' · ' + escapeHTML(details) : ''}</p>
          <p class="price">${escapeHTML(property.precio)}</p>
          ${property.descripcion ? `<p>${escapeHTML(property.descripcion)}</p>` : ''}
        </div>
      </article>`;
  }

  function render(properties) {
    const rentals = properties.filter(p =>
      String(p.operacion).toLowerCase() === 'arriendo'
    );
    const sales = properties.filter(p =>
      String(p.operacion).toLowerCase() === 'venta'
    );

    rentList.innerHTML = rentals.map(makeCard).join('');
    saleList.innerHTML = sales.map(makeCard).join('');

    if (rentEmpty) rentEmpty.style.display = rentals.length ? 'none' : '';
    if (saleEmpty) saleEmpty.style.display = sales.length ? 'none' : '';
  }

  async function loadProperties() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/propiedades?select=id,titulo,operacion,tipo,comuna,precio,caracteristicas,descripcion,fotografias,publicada,created_at&publicada=eq.true&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error de Supabase: ${response.status}`);
      }

      render(await response.json());
    } catch (error) {
      console.error('No se pudieron cargar las propiedades:', error);
    }
  }

  const form = $('searchForm');

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      await loadProperties();

      const operation = $('operation')?.value || 'Todas';
      const type = $('type')?.value || 'Todas';
      const location = ($('location')?.value || '').trim().toLowerCase();

      const filter = list => {
        const cards = [...list.querySelectorAll('.property')];

        cards.forEach(card => {
          const text = card.textContent.toLowerCase();
          const operationOK = operation === 'Todas' ||
            text.includes(operation.toLowerCase());
          const typeOK = type === 'Todas' ||
            text.includes(type.toLowerCase());
          const locationOK = !location || text.includes(location);

          card.style.display =
            operationOK && typeOK && locationOK ? '' : 'none';
        });
      };

      filter(rentList);
      filter(saleList);

      if (operation === 'Venta') {
        $('ventas')?.scrollIntoView({ behavior: 'smooth' });
      } else if (operation === 'Arriendo') {
        $('arriendos')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  loadProperties();
})();
