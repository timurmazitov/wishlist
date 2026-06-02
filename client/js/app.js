const API_BASE = '/api';

const COOKIE_GUEST_ID = 'selected_guest_id';
const COOKIE_DAYS = 30;

const state = {
  guestId: null,
  guestName: null,
  gifts: [],
  selections: {},
  savedSelections: []
};

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(name) {
  $$('.screen').forEach((el) => (el.style.display = 'none'));
  $(`#screen-${name}`).style.display = 'block';

  const footer = $('#app-footer');
  const footerGifts = $('#footer-gifts');

  if (name === 'welcome' || name === 'guest') {
    footer.style.display = 'none';
    footerGifts.style.display = 'none';
  } else if (name === 'gifts') {
    footer.style.display = 'block';
    footerGifts.style.display = 'block';
  } else if (name === 'saved') {
    footer.style.display = 'none';
    footerGifts.style.display = 'none';
  }
}

function closeModal() {
  $('#gift-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function openGiftModal(gift) {
  const imageSrc = gift.image_path
    ? gift.image_path
    : `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
           <rect fill="#e6edec" width="400" height="200"/>
           <text x="200" y="100" text-anchor="middle" fill="#6B8E6B" font-size="16">🎁</text>
         </svg>`
      )}`;

  $('#modal-image').src = imageSrc;
  $('#modal-name').textContent = gift.name;
  $('#modal-description').textContent = gift.description;
  $('#modal-price').textContent = `${gift.price} ₽`;

  const linksContainer = $('#modal-links');
  linksContainer.innerHTML = '';
  if (gift.links && gift.links.length > 0) {
    gift.links.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'modal-link';
      a.textContent = link.title;
      linksContainer.appendChild(a);
    });
  } else {
    linksContainer.innerHTML =
      '<p class="text-sm text-gray-400">Ссылки не указаны</p>';
  }

  $('#gift-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function renderGiftCard(gift) {
  const count = state.selections[gift.id] || 0;
  const initialDbCount = (state.initialDbCounts && state.initialDbCounts[gift.id]) || 0;
  const isLimited = gift.total_needed > 0;
  const myMax = gift.total_needed === 0 ? Infinity : gift.total_needed - (gift.selected_total || 0) + initialDbCount;
  const remainingForMe = myMax - count;

  const imageSrc = gift.image_path
    ? gift.image_path
    : `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
           <rect fill="#e6edec" width="400" height="200"/>
           <text x="200" y="100" text-anchor="middle" fill="#6B8E6B" font-size="14">${gift.name}</text>
         </svg>`
      )}`;

  const availabilityHtml = isLimited
    ? `<span class="gift-availability ${
        remainingForMe <= 0 ? 'bg-red-100 text-red-500' : 'bg-sage-100 text-primary'
      }">${remainingForMe <= 0 ? 'Разобрали' : `Доступно: ${remainingForMe} шт.`}</span>`
    : '';

  return `
    <div class="gift-card bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="gift-card-image-wrapper" style="position: relative;">
        <img src="${imageSrc}" alt="${gift.name}" class="gift-card-image" loading="lazy">
        ${isLimited ? `<div style="position: absolute; top: 8px; right: 8px;">${availabilityHtml}</div>` : ''}
      </div>
      <div class="p-4">
        <div class="flex items-start justify-between gap-2 mb-2">
          <h3 class="font-medium text-gray-900 text-base line-clamp-2">${gift.name}</h3>
          <span class="font-bold text-primary whitespace-nowrap">${gift.price} ₽</span>
        </div>
        <div class="flex items-center justify-center gap-3 mt-3">
          <button class="btn-quantity bg-warm-200 text-gray-600 hover:bg-warm-300" data-action="decrease" data-gift-id="${gift.id}" ${count <= 0 ? 'disabled' : ''}>−</button>
          <span class="quantity-display">${count}</span>
          <button class="btn-quantity bg-primary text-white hover:bg-primary-dark" data-action="increase" data-gift-id="${gift.id}" ${(isLimited && count >= myMax) ? 'disabled' : ''}>+</button>
        </div>
      </div>
    </div>
  `;
}

function updateQuantity(giftId, delta) {
  const current = state.selections[giftId] || 0;
  const newCount = current + delta;
  if (newCount < 0) return;

  const gift = state.gifts.find((g) => g.id === giftId);
  if (!gift) return;

  if (delta > 0 && gift.total_needed > 0) {
    const initialDbCount = (state.initialDbCounts && state.initialDbCounts[giftId]) || 0;
    const myMax = gift.total_needed - (gift.selected_total || 0) + initialDbCount;
    if (newCount > myMax) {
      return;
    }
  }

  if (newCount === 0) {
    delete state.selections[giftId];
  } else {
    state.selections[giftId] = newCount;
  }

  renderGiftsList();
  updateSummary();
}

function updateSummary() {
  const entries = Object.entries(state.selections);
  const totalItems = entries.reduce((sum, [, qty]) => sum + qty, 0);
  const totalPrice = entries.reduce((sum, [giftId, qty]) => {
    const gift = state.gifts.find((g) => g.id === Number(giftId));
    return sum + (gift ? gift.price * qty : 0);
  }, 0);

  $('#selected-count').textContent = totalItems;
  $('#selected-total').textContent = totalPrice;
  $('#btn-save').disabled = totalItems === 0;
}

function renderGiftsList() {
  const container = $('#gifts-list');
  container.innerHTML = state.gifts.map((gift) => renderGiftCard(gift)).join('');

  container.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const giftId = Number(btn.dataset.giftId);
      updateQuantity(giftId, action === 'increase' ? 1 : -1);
    });
  });

  container.querySelectorAll('.gift-card').forEach((card, index) => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('[data-action]')) {
        openGiftModal(state.gifts[index]);
      }
    });
  });
}

async function loadGifts() {
  try {
    const res = await fetch(`${API_BASE}/gifts`);
    state.gifts = await res.json();
  } catch (err) {
    console.error('Failed to load gifts:', err);
  }
}

async function loadGuests() {
  try {
    const res = await fetch(`${API_BASE}/guests`);
    const guests = await res.json();
    const list = $('#guest-list');
    list.innerHTML = '';
    guests.forEach((guest) => {
      const li = document.createElement('li');
      li.dataset.guestId = guest.id;
      li.dataset.guestName = guest.name;
      li.className = 'guest-list-item';
      li.textContent = guest.name;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load guests:', err);
  }
}

async function loadSavedSelections() {
  if (!state.guestId) return;
  try {
    const res = await fetch(`${API_BASE}/selections?guest_id=${state.guestId}`);
    const selections = await res.json();
    state.savedSelections = selections;
    renderSavedList();
  } catch (err) {
    console.error('Failed to load saved selections:', err);
  }
}

function renderSavedList() {
  const container = $('#saved-list');
  const sendButtons = $('#send-buttons');

  if (state.savedSelections.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-12">
        <span class="material-icons text-5xl mb-3">inventory_2</span>
        <p>Нет сохранённых подарков</p>
      </div>`;
    sendButtons.style.display = 'none';
    return;
  }

  const totalPrice = state.savedSelections.reduce((sum, s) => sum + s.price * s.quantity, 0);

  container.innerHTML = `
    <div class="space-y-3">
      ${state.savedSelections
        .map(
          (s) => `
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <h3 class="font-medium text-gray-900">${s.gift_name}</h3>
              <p class="text-sm text-sage-300">${s.price} ₽ × ${s.quantity} шт. = <span class="font-medium text-primary">${s.price * s.quantity} ₽</span></p>
            </div>
            <span class="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">${s.quantity}</span>
          </div>
        </div>`
        )
        .join('')}
      <div class="bg-primary-pale rounded-xl p-4 text-center shadow-sm">
        <span class="text-sm text-sage-300">Итого:</span>
        <span class="text-lg font-bold text-primary ml-2">${totalPrice} ₽</span>
      </div>
    </div>`;

  sendButtons.style.display = 'flex';
}

function gotoWelcomeScreen() {
  showScreen('welcome');
}

async function gotoGuestScreen() {
  state.guestId = null;
  state.guestName = null;
  state.selections = {};
  state.savedSelections = [];
  delete state.initialDbCounts;
  deleteCookie(COOKIE_GUEST_ID);
  showScreen('guest');
  await loadGuests();
}

async function gotoGiftsScreen() {
  if (!state.guestId) return;
  setCookie(COOKIE_GUEST_ID, state.guestId, COOKIE_DAYS);
  await loadGifts();

  $('#guest-name-display-gifts').textContent = state.guestName || '';

  const res = await fetch(`${API_BASE}/selections?guest_id=${state.guestId}`);
  const saved = await res.json();
  state.selections = {};
  state.initialDbCounts = {};
  saved.forEach((s) => {
    state.selections[s.gift_id] = s.quantity;
    state.initialDbCounts[s.gift_id] = s.quantity;
  });

  renderGiftsList();
  updateSummary();
  showScreen('gifts');
}

async function gotoSavedScreen() {
  if (state.guestId) {
    setCookie(COOKIE_GUEST_ID, state.guestId, COOKIE_DAYS);
  }
  $('#guest-name-display').textContent = state.guestName || '';
  showScreen('saved');
  await loadSavedSelections();
}

async function saveSelections() {
  if (!state.guestId) return;
  const entries = Object.entries(state.selections);

  try {
    await fetch(`${API_BASE}/selections?guest_id=${state.guestId}`, {
      method: 'DELETE'
    });

    for (const [giftId, quantity] of entries) {
      const res = await fetch(`${API_BASE}/selections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: state.guestId,
          gift_id: Number(giftId),
          quantity
        })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Не удалось сохранить');
        await gotoGiftsScreen();
        return;
      }
    }

    delete state.initialDbCounts;
    state.selections = {};
    await gotoSavedScreen();
  } catch (err) {
    console.error('Failed to save selections:', err);
    await gotoGiftsScreen();
  }
}

async function clearAllSelections() {
  state.selections = {};
  delete state.initialDbCounts;
  renderGiftsList();
  updateSummary();
}

async function sendEmail() {
  if (!state.guestId) return;
  try {
    const res = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_id: state.guestId })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Email отправлен!');
    } else {
      alert(`Ошибка: ${data.error}`);
    }
  } catch (err) {
    console.error('Failed to send email:', err);
    alert('Не удалось отправить email');
  }
}

async function init() {
  $('#btn-start').addEventListener('click', async () => {
    await gotoGuestScreen();
  });

  $('#btn-select-guest').addEventListener('click', async () => {
    const selected = $('#guest-list .selected');
    state.guestId = Number(selected.dataset.guestId);
    state.guestName = selected.dataset.guestName;
    if (!state.guestId) return;

    try {
      const selRes = await fetch(`${API_BASE}/selections?guest_id=${state.guestId}`);
      if (selRes.ok) {
        const selections = await selRes.json();
        if (selections.length > 0) {
          state.savedSelections = selections;
          await gotoSavedScreen();
          return;
        }
      }
    } catch (err) {
      console.error('Error checking saved selections:', err);
    }

    await gotoGiftsScreen();
  });

  $('#guest-list').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    $$('#guest-list li').forEach((el) => el.classList.remove('selected'));
    li.classList.add('selected');
    $('#btn-select-guest').disabled = false;
  });

  document.addEventListener('click', async (e) => {
    const restartBtn = e.target.closest('[data-action="restart"]');
    if (restartBtn) {
      gotoWelcomeScreen();
    }
  });

  $('#btn-clear-footer').addEventListener('click', clearAllSelections);

  $('#btn-save').addEventListener('click', saveSelections);

  $('#btn-back').addEventListener('click', async () => {
    await gotoGiftsScreen();
  });

  $('#btn-modal-close').addEventListener('click', closeModal);
  $('#modal-overlay').addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  const savedGuestId = getCookie(COOKIE_GUEST_ID);
  if (savedGuestId) {
    state.guestId = Number(savedGuestId);

    try {
      const guestsRes = await fetch(`${API_BASE}/guests`);
      if (guestsRes.ok) {
        const guests = await guestsRes.json();
        const guest = guests.find((g) => g.id === state.guestId);
        if (guest) state.guestName = guest.name;
      }
    } catch (err) {
      console.error('Error fetching guest name:', err);
    }

    try {
      const selRes = await fetch(`${API_BASE}/selections?guest_id=${state.guestId}`);
      if (selRes.ok) {
        const selections = await selRes.json();
        if (selections.length > 0) {
          state.savedSelections = selections;
          await gotoSavedScreen();
          return;
        }
      }
    } catch (err) {
      console.error('Error checking saved selections:', err);
    }

    await gotoGiftsScreen();
    return;
  }
}

init();
