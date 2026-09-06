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

const CART_KEY = 'aureliaCart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {}
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
  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id] = qty;
  }
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
  const cart = getCart();
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
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
      <div class="product-image" data-open-product="${p.id}">${ringSVG(p, p.id)}</div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-material">${p.material}</div>
        <div class="product-price">${formatPrice(p.price)}</div>
        <div class="product-actions">
          <button class="add-btn" data-add="${p.id}">В корзину</button>
        </div>
      </div>
    </div>
  `).join('');
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
  content.innerHTML = `
    <button class="close-btn" id="closeProductModal" aria-label="Закрыть" style="position:absolute;top:16px;right:20px;">&times;</button>
    <div class="product-view">
      <div class="product-view-image">${ringSVG(product, 'm-' + product.id)}</div>
      <div class="product-view-info">
        <h3>${product.name}</h3>
        <p class="product-material">${product.material}</p>
        <div class="product-price">${formatPrice(product.price)}</div>
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

  let qty = 1;
  const qtyEl = document.getElementById('modalQty');
  document.getElementById('modalInc').addEventListener('click', () => {
    qty += 1;
    qtyEl.textContent = qty;
  });
  document.getElementById('modalDec').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    qtyEl.textContent = qty;
  });
  document.getElementById('modalAdd').addEventListener('click', () => {
    addToCart(product.id, qty);
    closeModal(modal);
  });
  document.getElementById('closeProductModal').addEventListener('click', () => closeModal(modal));
}

function closeModal(modal) {
  modal.classList.remove('open');
  if (!document.getElementById('cartDrawer').classList.contains('open')) {
    document.getElementById('overlay').classList.remove('active');
  }
}

function initHero() {
  const hero = PRODUCTS[4];
  document.getElementById('heroVisual').innerHTML = ringSVG(hero, 'hero');
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
    if (addBtn) {
      addToCart(addBtn.dataset.add, 1);
      return;
    }
    const imageEl = e.target.closest('[data-open-product]');
    if (imageEl) {
      openProductModal(imageEl.dataset.openProduct);
    }
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
  document.getElementById('burgerBtn').addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'productModal') {
    document.getElementById('productModal').classList.remove('open');
  }
  if (e.target.id === 'checkoutModal') {
    document.getElementById('checkoutModal').classList.remove('open');
  }
});

function init() {
  initHero();
  renderProductGrid();
  renderCart();
  initFilters();
  initGridEvents();
  initCartEvents();
  initCheckout();
  initContactForm();
  initNav();
}

document.addEventListener('DOMContentLoaded', init);
