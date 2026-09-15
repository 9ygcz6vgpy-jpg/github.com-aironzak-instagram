const BAND_COLORS = {
  gold: { light: '#f3d999', dark: '#b8925a' },
  rose: { light: '#f2c9bd', dark: '#c98a72' },
  silver: { light: '#f1f1ef', dark: '#a9a9a4' },
  platinum: { light: '#f4f3f0', dark: '#b7b5ad' },
};

const GEM_COLORS = {
  none: null,
  diamond: '#e9f6ff',
  sapphire: '#3b5bb0',
  ruby: '#b0273b',
  emerald: '#2f8f5f',
};

const BAND_MATERIAL = {
  gold: { color: 0xd9ac5c, metalness: 1, roughness: 0.28 },
  rose: { color: 0xe3ab92, metalness: 1, roughness: 0.3 },
  silver: { color: 0xd0d1d3, metalness: 1, roughness: 0.2 },
  platinum: { color: 0xdedcd4, metalness: 1, roughness: 0.16 },
};

const GEM_HEX = {
  none: null,
  diamond: 0xf5fbff,
  sapphire: 0x2f4fae,
  ruby: 0xa31f36,
  emerald: 0x1f8f5f,
};

const PRODUCTS = [
  { id: 'r1', name: 'Кольцо «Вечность»', category: 'wedding', material: 'Золото 585', band: 'gold', gem: 'none', price: 24900 },
  { id: 'r2', name: 'Кольцо «Классика»', category: 'wedding', material: 'Серебро 925', band: 'silver', gem: 'none', price: 8900 },
  { id: 'r3', name: 'Кольцо «Нежность»', category: 'wedding', material: 'Розовое золото 585', band: 'rose', gem: 'none', price: 27900 },
  { id: 'r4', name: 'Кольцо «Сияние» с бриллиантом', category: 'engagement', material: 'Золото 585, бриллиант', band: 'gold', gem: 'diamond', price: 89900 },
  { id: 'r5', name: 'Кольцо «Мечта» с бриллиантом', category: 'engagement', material: 'Платина, бриллиант', band: 'platinum', gem: 'diamond', price: 154900 },
  { id: 'r6', name: 'Кольцо «Обещание»', category: 'engagement', material: 'Розовое золото, бриллиант', band: 'rose', gem: 'diamond', price: 112900 },
  { id: 'r7', name: 'Кольцо «Океан» с сапфиром', category: 'gemstone', material: 'Золото 585, сапфир', band: 'gold', gem: 'sapphire', price: 67900 },
  { id: 'r8', name: 'Кольцо «Страсть» с рубином', category: 'gemstone', material: 'Золото 585, рубин', band: 'gold', gem: 'ruby', price: 71900 },
  { id: 'r9', name: 'Кольцо «Изумрудный лес»', category: 'gemstone', material: 'Серебро 925, изумруд', band: 'silver', gem: 'emerald', price: 34900 },
  { id: 'r10', name: 'Кольцо «Атлант»', category: 'men', material: 'Серебро 925', band: 'silver', gem: 'none', price: 14900 },
  { id: 'r11', name: 'Кольцо «Титан» с ониксом', category: 'men', material: 'Золото 585, оникс', band: 'gold', gem: 'none', price: 39900 },
  { id: 'r12', name: 'Кольцо «Страж» с сапфиром', category: 'men', material: 'Платина, сапфир', band: 'platinum', gem: 'sapphire', price: 98900 },
];

function ringSVG(product, uid) {
  const band = BAND_COLORS[product.band];
  const gem = GEM_COLORS[product.gem];
  const gradId = `band-${uid}`;
  const gemMarkup = gem
    ? `<circle cx="100" cy="46" r="15" fill="${gem}" stroke="#ffffff" stroke-width="2"/>
       <path d="M91 40 L100 31 L109 40 Z" fill="${gem}" opacity="0.9"/>`
    : '';
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${band.light}"/>
          <stop offset="100%" stop-color="${band.dark}"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="120" r="60" fill="none" stroke="url(#${gradId})" stroke-width="18"/>
      ${gemMarkup}
    </svg>`;
}

function formatPrice(value) {
  return value.toLocaleString('ru-RU') + ' ₽';
}

/* ---------- 3D ring engine (Three.js) ---------- */

const POOL_SIZE = 6;
const ringPool = [];
let heroRing = null;
let modalRing = null;
const activeRenderers = new Set();
const has3D = typeof THREE !== 'undefined';
const ringClock = has3D ? new THREE.Clock() : null;

/* ---------- Exploded view ---------- */

const GEM_EXPLODE_OFFSET = has3D ? new THREE.Vector3(0, 0.95, 0.18) : null;
const PRONG_EXPLODE_OFFSET = has3D ? new THREE.Vector3(0, 0.42, 0.08) : null;
const BAND_EXPLODE_OFFSET = has3D ? new THREE.Vector3(0, -0.22, -0.05) : null;

function setLinePoints(line, a, b) {
  const arr = line.geometry.attributes.position.array;
  arr[0] = a.x; arr[1] = a.y; arr[2] = a.z;
  arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
  line.geometry.attributes.position.needsUpdate = true;
}

function positionRingParts(inst, t) {
  inst.gem.position.copy(inst.gemBasePos).addScaledVector(GEM_EXPLODE_OFFSET, t);
  inst.prongGroup.position.copy(inst.prongBasePos).addScaledVector(PRONG_EXPLODE_OFFSET, t);
  inst.band.position.copy(inst.bandBasePos).addScaledVector(BAND_EXPLODE_OFFSET, t);

  setLinePoints(inst.line1, inst.band.position, inst.prongGroup.position);
  setLinePoints(inst.line2, inst.prongGroup.position, inst.gem.position);
  const lineOpacity = Math.max(0, t - 0.08) * 0.9;
  inst.line1.material.opacity = lineOpacity;
  inst.line2.material.opacity = lineOpacity;

  inst.camera.position.z = THREE.MathUtils.lerp(4.1, 5.3, t);
  inst.camera.position.y = THREE.MathUtils.lerp(0.5, 0.8, t);
  inst.camera.lookAt(0, THREE.MathUtils.lerp(-0.05, 0.25, t), 0);
}

function updateExplode(inst, delta) {
  if (inst.explodeCurrent === inst.explodeTarget) return;
  inst.explodeCurrent += (inst.explodeTarget - inst.explodeCurrent) * Math.min(1, delta * 5);
  if (Math.abs(inst.explodeTarget - inst.explodeCurrent) < 0.002) inst.explodeCurrent = inst.explodeTarget;
  positionRingParts(inst, inst.explodeCurrent);
}

function toggleExplode(inst, btn, labelId, legendId) {
  const next = inst.explodeTarget > 0.5 ? 0 : 1;
  inst.explodeTarget = next;
  btn.classList.toggle('is-exploded', next === 1);
  const label = document.getElementById(labelId);
  if (label) label.textContent = next === 1 ? 'Собрать кольцо' : 'Разобрать кольцо';
  const legend = document.getElementById(legendId);
  if (legend) legend.classList.toggle('visible', next === 1);
}

function makeRingInstance() {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
  camera.position.set(0, 0.5, 4.1);
  camera.lookAt(0, -0.05, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  scene.add(new THREE.HemisphereLight(0xfff6e6, 0x2a2013, 1.1));
  const key = new THREE.DirectionalLight(0xfff2da, 2.0);
  key.position.set(2.2, 2.6, 2.4);
  scene.add(key);
  const key2 = new THREE.DirectionalLight(0xffffff, 1.3);
  key2.position.set(-1.8, 1.4, 2.8);
  scene.add(key2);
  const rim = new THREE.DirectionalLight(0xffcf8f, 1.1);
  rim.position.set(-2.4, -1.2, -2);
  scene.add(rim);
  const under = new THREE.DirectionalLight(0xbfe0ff, 0.6);
  under.position.set(0.5, -2.4, 1.5);
  scene.add(under);

  const group = new THREE.Group();

  const bandGeo = new THREE.TorusGeometry(1, 0.3, 36, 110);
  bandGeo.rotateX(Math.PI / 2.55);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xd9ac5c, metalness: 0.6, roughness: 0.3 });
  const band = new THREE.Mesh(bandGeo, bandMat);
  group.add(band);

  const gemGeo = new THREE.IcosahedronGeometry(0.26, 1);
  gemGeo.scale(1, 1.1, 1);
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.05, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.15,
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.set(0, 0.42, 0.55);
  gem.visible = false;
  group.add(gem);

  const prongGeo = new THREE.ConeGeometry(0.05, 0.24, 8);
  const prongGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + Math.PI / 4;
    const prong = new THREE.Mesh(prongGeo, bandMat);
    prong.position.set(Math.cos(angle) * 0.16, 0, Math.sin(angle) * 0.16);
    prongGroup.add(prong);
  }
  prongGroup.position.set(0, 0.30, 0.50);
  prongGroup.visible = false;
  group.add(prongGroup);

  const lineMat1 = new THREE.LineBasicMaterial({ color: 0xd9ac5c, transparent: true, opacity: 0 });
  const lineGeom1 = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const line1 = new THREE.Line(lineGeom1, lineMat1);
  line1.visible = false;
  group.add(line1);

  const lineMat2 = lineMat1.clone();
  const lineGeom2 = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const line2 = new THREE.Line(lineGeom2, lineMat2);
  line2.visible = false;
  group.add(line2);

  group.rotation.x = -0.15;

  scene.add(group);

  return {
    canvas, renderer, scene, camera, group, band, bandMat, gem, gemMat, prongGroup, line1, line2,
    bandBasePos: band.position.clone(),
    gemBasePos: gem.position.clone(),
    prongBasePos: prongGroup.position.clone(),
    explodeTarget: 0, explodeCurrent: 0, hasGem: false,
    mounted: null, productId: null, dragging: false,
  };
}

function resizeRingInstance(inst, w, h) {
  if (!w || !h) return;
  inst.renderer.setSize(w, h, false);
  inst.camera.aspect = w / h;
  inst.camera.updateProjectionMatrix();
}

function applyProductToRing(inst, product) {
  const bm = BAND_MATERIAL[product.band];
  inst.bandMat.color.setHex(bm.color);
  inst.bandMat.metalness = bm.metalness;
  inst.bandMat.roughness = bm.roughness;
  const gemHex = GEM_HEX[product.gem];
  const hasGem = !!gemHex;
  if (hasGem) {
    inst.gem.visible = true;
    inst.gemMat.color.setHex(gemHex);
  } else {
    inst.gem.visible = false;
  }
  inst.prongGroup.visible = hasGem;
  inst.line1.visible = hasGem;
  inst.line2.visible = hasGem;
  inst.hasGem = hasGem;
  inst.explodeTarget = 0;
  inst.explodeCurrent = 0;
  positionRingParts(inst, 0);
  inst.productId = product.id;
}

function mountRing(inst, container) {
  if (inst.mounted === container) return;
  container.innerHTML = '';
  container.appendChild(inst.canvas);
  inst.mounted = container;
  const rect = container.getBoundingClientRect();
  resizeRingInstance(inst, Math.round(rect.width), Math.round(rect.height));
  activeRenderers.add(inst);
}

function unmountRing(inst) {
  if (inst.mounted && inst.canvas.parentElement === inst.mounted) {
    inst.mounted.innerHTML = '';
  }
  inst.mounted = null;
  inst.productId = null;
  activeRenderers.delete(inst);
}

function ringTick() {
  const delta = Math.min(ringClock.getDelta(), 0.05);
  activeRenderers.forEach((inst) => {
    if (!inst.dragging) inst.group.rotation.y += delta * 0.55;
    updateExplode(inst, delta);
    inst.renderer.render(inst.scene, inst.camera);
  });
  requestAnimationFrame(ringTick);
}

function attachDrag(inst) {
  let lastX = 0, lastY = 0;
  inst.canvas.addEventListener('pointerdown', (e) => {
    inst.dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    inst.canvas.setPointerCapture(e.pointerId);
    inst.canvas.style.cursor = 'grabbing';
  });
  inst.canvas.addEventListener('pointermove', (e) => {
    if (!inst.dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    inst.group.rotation.y += dx * 0.012;
    inst.group.rotation.x = Math.max(-0.6, Math.min(0.6, inst.group.rotation.x + dy * 0.012));
    lastX = e.clientX; lastY = e.clientY;
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => {
    inst.canvas.addEventListener(evt, () => {
      inst.dragging = false;
      inst.canvas.style.cursor = 'grab';
    });
  });
}

let gridObserver = null;

function refreshPoolAssignments() {
  const placeholders = Array.from(document.querySelectorAll('.product-image'));
  const visible = placeholders.filter((p) => p.dataset.visible === '1');

  ringPool.forEach((inst) => {
    if (inst.productId && !visible.some((p) => p.dataset.productId === inst.productId)) {
      unmountRing(inst);
    }
  });

  visible.forEach((p) => {
    const pid = p.dataset.productId;
    const already = ringPool.find((inst) => inst.productId === pid);
    if (already) { mountRing(already, p); return; }
    const free = ringPool.find((inst) => !inst.productId);
    if (free) {
      const product = PRODUCTS.find((pr) => pr.id === pid);
      applyProductToRing(free, product);
      mountRing(free, p);
    }
  });
}

function observeGrid() {
  if (!gridObserver) {
    gridObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.dataset.visible = entry.isIntersecting ? '1' : '0';
      });
      refreshPoolAssignments();
    }, { rootMargin: '120px' });
  } else {
    gridObserver.disconnect();
  }
  document.querySelectorAll('.product-image').forEach((el) => gridObserver.observe(el));
}

function initRingEngine() {
  if (!has3D) return;
  for (let i = 0; i < POOL_SIZE; i++) ringPool.push(makeRingInstance());
  requestAnimationFrame(ringTick);

  window.addEventListener('resize', () => {
    [heroRing, modalRing, ...ringPool].forEach((inst) => {
      if (inst && inst.mounted) {
        const rect = inst.mounted.getBoundingClientRect();
        resizeRingInstance(inst, Math.round(rect.width), Math.round(rect.height));
      }
    });
  });
}

const CART_KEY = 'aureliaCartPreview';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; }
}

function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  saveCart(cart);
  renderCart();
  openCart();
}

function setQty(id, qty) {
  const cart = getCart();
  if (qty <= 0) delete cart[id]; else cart[id] = qty;
  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
  renderCart();
}

function getCartCount() {
  return Object.values(getCart()).reduce((sum, qty) => sum + qty, 0);
}

function getCartTotal() {
  const cart = getCart();
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find((p) => p.id === id);
    return product ? sum + product.price * qty : sum;
  }, 0);
}

function renderProductGrid(filter = 'all') {
  const grid = document.getElementById('productGrid');
  const list = filter === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
  grid.innerHTML = list.map((p) => `
    <div class="product-card">
      <div class="product-image" data-open-product="${p.id}" data-product-id="${p.id}">${has3D ? '' : ringSVG(p, p.id)}</div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <p class="product-material">${p.material}</p>
        <div class="product-price">${formatPrice(p.price)}</div>
        <div class="product-actions">
          <button class="add-btn" data-add="${p.id}">В корзину</button>
        </div>
      </div>
    </div>
  `).join('');

  attachTilt();
  if (has3D) {
    observeGrid();
    refreshPoolAssignments();
  }
}

function attachTilt(selector = '.product-card', max = 7) {
  document.querySelectorAll(selector).forEach((el) => {
    if (el.dataset.tiltReady) return;
    el.dataset.tiltReady = '1';
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--ry', `${px * max * 2}deg`);
      el.style.setProperty('--rx', `${-py * max * 2}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

function renderCart() {
  const items = document.getElementById('cartItems');
  const cart = getCart();
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    items.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
  } else {
    items.innerHTML = entries.map(([id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      if (!product) return '';
      return `
        <div class="cart-item">
          <div class="cart-item-thumb">${ringSVG(product, 'c-' + id)}</div>
          <div>
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" data-dec="${id}">−</button>
              <span>${qty}</span>
              <button class="qty-btn" data-inc="${id}">+</button>
              <button class="remove-btn" data-remove="${id}">Удалить</button>
            </div>
          </div>
          <div class="cart-item-price">${formatPrice(product.price * qty)}</div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('cartCount').textContent = getCartCount();
  document.getElementById('cartTotal').textContent = formatPrice(getCartTotal());
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

function openProductModal(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  const modal = document.getElementById('productModal');
  const content = document.getElementById('productModalContent');
  const canExplode = has3D && product.gem !== 'none';
  const explodeBlock = canExplode ? `
    <div class="explode-controls">
      <button class="btn btn-outline explode-btn" id="modalExplodeBtn" type="button">
        <span class="explode-btn-icon" aria-hidden="true">⇕</span>
        <span id="modalExplodeLabel">Разобрать кольцо</span>
      </button>
      <div class="explode-legend" id="modalExplodeLegend">
        <span><i class="legend-dot dot-gem"></i>Камень</span>
        <span><i class="legend-dot dot-prong"></i>Оправа (каст)</span>
        <span><i class="legend-dot dot-band"></i>Шинка (кольцо)</span>
      </div>
    </div>` : '';
  content.innerHTML = `
    <button class="close-btn" id="closeProductModal" aria-label="Закрыть" style="position:absolute;top:16px;right:20px;">&times;</button>
    <div class="product-view">
      <div class="product-view-image" id="modalRingMount">
        ${has3D ? '<p class="product-view-hint">Потяните, чтобы повернуть</p>' : ringSVG(product, 'm-' + product.id)}
      </div>
      <div class="product-view-info">
        <h3>${product.name}</h3>
        <p class="product-material">${product.material}</p>
        <div class="product-price">${formatPrice(product.price)}</div>
        ${explodeBlock}
        <div class="qty-selector">
          <button class="qty-btn" id="modalDec">−</button>
          <span id="modalQty">1</span>
          <button class="qty-btn" id="modalInc">+</button>
        </div>
        <button class="btn btn-primary btn-full" id="modalAdd">Добавить в корзину</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
  document.getElementById('overlay').classList.add('active');

  if (has3D) {
    if (!modalRing) {
      modalRing = makeRingInstance();
      attachDrag(modalRing);
    }
    applyProductToRing(modalRing, product);
    modalRing.group.rotation.set(0, 0, 0);
    const hint = document.querySelector('.product-view-hint');
    const mount = document.getElementById('modalRingMount');
    mount.appendChild(modalRing.canvas);
    if (hint) mount.appendChild(hint);
    modalRing.canvas.style.cursor = 'grab';
    const rect = mount.getBoundingClientRect();
    resizeRingInstance(modalRing, Math.round(rect.width), Math.round(rect.height));
    modalRing.mounted = mount;
    activeRenderers.add(modalRing);

    if (canExplode) {
      const explodeBtn = document.getElementById('modalExplodeBtn');
      explodeBtn.addEventListener('click', () => toggleExplode(modalRing, explodeBtn, 'modalExplodeLabel', 'modalExplodeLegend'));
    }
  }

  let qty = 1;
  const qtyEl = document.getElementById('modalQty');
  document.getElementById('modalInc').addEventListener('click', () => { qty += 1; qtyEl.textContent = qty; });
  document.getElementById('modalDec').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyEl.textContent = qty; });
  document.getElementById('modalAdd').addEventListener('click', () => { addToCart(product.id, qty); closeModal(modal); });
  document.getElementById('closeProductModal').addEventListener('click', () => closeModal(modal));
}

function closeModal(modal) {
  modal.classList.remove('open');
  if (modal.id === 'productModal' && modalRing) {
    activeRenderers.delete(modalRing);
  }
  if (!document.getElementById('cartDrawer').classList.contains('open')) {
    document.getElementById('overlay').classList.remove('active');
  }
}

function initHero() {
  const container = document.getElementById('heroVisual');
  const controls = document.getElementById('heroExplodeControls');
  if (!has3D) {
    container.innerHTML = ringSVG(PRODUCTS[4], 'hero');
    if (controls) controls.style.display = 'none';
    return;
  }
  heroRing = makeRingInstance();
  applyProductToRing(heroRing, PRODUCTS[4]);
  mountRing(heroRing, container);

  const btn = document.getElementById('heroExplodeBtn');
  if (btn) btn.addEventListener('click', () => toggleExplode(heroRing, btn, 'heroExplodeLabel', 'heroExplodeLegend'));
}

function initFilters() {
  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderProductGrid(btn.dataset.category);
  });
}

function initGridEvents() {
  document.getElementById('productGrid').addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) { addToCart(addBtn.dataset.add, 1); return; }
    const imageEl = e.target.closest('[data-open-product]');
    if (imageEl) openProductModal(imageEl.dataset.openProduct);
  });
}

function initCartEvents() {
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('overlay').addEventListener('click', () => {
    closeCart();
    document.getElementById('productModal').classList.remove('open');
    document.getElementById('checkoutModal').classList.remove('open');
  });

  document.getElementById('cartItems').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const remove = e.target.closest('[data-remove]');
    const cart = getCart();
    if (inc) setQty(inc.dataset.inc, (cart[inc.dataset.inc] || 0) + 1);
    if (dec) setQty(dec.dataset.dec, (cart[dec.dataset.dec] || 0) - 1);
    if (remove) removeFromCart(remove.dataset.remove);
  });
}

function initCheckout() {
  const checkoutModal = document.getElementById('checkoutModal');
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (getCartCount() === 0) return;
    document.getElementById('checkoutBody').classList.remove('hidden');
    document.getElementById('checkoutSuccess').classList.add('hidden');
    checkoutModal.classList.add('open');
    document.getElementById('overlay').classList.add('active');
  });
  document.getElementById('closeCheckout').addEventListener('click', () => closeModal(checkoutModal));

  document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveCart({});
    renderCart();
    document.getElementById('checkoutBody').classList.add('hidden');
    document.getElementById('checkoutSuccess').classList.remove('hidden');
    e.target.reset();
  });

  document.getElementById('checkoutDone').addEventListener('click', () => {
    closeModal(checkoutModal);
    closeCart();
  });
}

function initContactForm() {
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('contactNote').textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
    e.target.reset();
  });
}

function initNav() {
  const nav = document.getElementById('mainNav');
  document.getElementById('burgerBtn').addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'productModal') document.getElementById('productModal').classList.remove('open');
  if (e.target.id === 'checkoutModal') document.getElementById('checkoutModal').classList.remove('open');
});

function init() {
  initRingEngine();
  initHero();
  renderProductGrid();
  renderCart();
  initFilters();
  initGridEvents();
  initCartEvents();
  initCheckout();
  initContactForm();
  initNav();
  attachTilt('.delivery-card', 5);
}

document.addEventListener('DOMContentLoaded', init);