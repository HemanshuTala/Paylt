import { checkDishAvailability, deductOrderFromStock, validateIngredientForm } from './domain.js';

let stockList = [];
let recipesList = [];
let searchQuery = '';
let editingIndex = -1;

const stockTableBody = document.getElementById('stockTableBody');
const stockCountBadge = document.getElementById('stockCountBadge');
const searchInput = document.getElementById('searchInput');
const menuList = document.getElementById('menuList');
const activityLog = document.getElementById('activityLog');

const ingredientModal = document.getElementById('ingredientModal');
const modalTitle = document.getElementById('modalTitle');
const modalErrors = document.getElementById('modalErrors');
const ingredientForm = document.getElementById('ingredientForm');

const modalName = document.getElementById('modalName');
const modalQty = document.getElementById('modalQty');
const modalUnit = document.getElementById('modalUnit');
const modalPar = document.getElementById('modalPar');

const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

async function loadInitialData() {
  try {
    const stockRes = await fetch('./stock.json');
    stockList = await stockRes.json();

    const recipesRes = await fetch('./recipes.json');
    recipesList = await recipesRes.json();

    logActivity('Initial stock and menu data loaded successfully.');
    updateUI();
  } catch (err) {
    logActivity('Error loading data files. Check browser console.');
    console.error(err);
  }
}

function updateUI() {
  renderStockTable();
  renderMenu();
}

function renderStockTable() {
  stockTableBody.innerHTML = '';

  const filteredStock = stockList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  stockCountBadge.textContent = `${filteredStock.length} items`;

  filteredStock.forEach((item) => {
    const realIndex = stockList.indexOf(item);
    const tr = document.createElement('tr');

    let statusBadge = '<span class="badge badge-ok">OK</span>';
    if (item.qty <= 0) {
      statusBadge = '<span class="badge badge-out">Out of Stock</span>';
    } else if (item.qty < item.par) {
      statusBadge = '<span class="badge badge-low">Below Par</span>';
    }

    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>
        ${item.qty} ${item.unit}
        <div style="margin-top: 4px; display: inline-block;">
          <button class="btn btn-secondary btn-sm adjust-qty-btn" data-index="${realIndex}" data-delta="1">+1</button>
          <button class="btn btn-secondary btn-sm adjust-qty-btn" data-index="${realIndex}" data-delta="-1">-1</button>
        </div>
      </td>
      <td>${item.par} ${item.unit}</td>
      <td>${statusBadge}</td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm edit-btn" data-index="${realIndex}">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn" data-index="${realIndex}">Delete</button>
      </td>
    `;

    stockTableBody.appendChild(tr);
  });
}

function renderMenu() {
  menuList.innerHTML = '';

  recipesList.forEach((dish, index) => {
    const check = checkDishAvailability(dish, stockList);
    const card = document.createElement('div');
    card.className = 'dish-card';

    const ingredientSummary = dish.ingredients
      .map(i => `${i.name}: ${i.qty}${i.unit}`)
      .join(', ');

    let badgeHtml = '<span class="badge badge-ok">Available</span>';
    let reasonHtml = '';

    if (!check.available) {
      badgeHtml = '<span class="badge badge-out">Unavailable</span>';
      reasonHtml = `<div class="order-reasons">⚠️ Cannot order: ${check.reasons.join(' | ')}</div>`;
    }

    card.innerHTML = `
      <div class="dish-header">
        <span class="dish-title">${dish.dish}</span>
        <span class="dish-price">₹${dish.price}</span>
      </div>
      <div>${badgeHtml}</div>
      <div class="ingredients-list"><strong>Recipe:</strong> ${ingredientSummary}</div>
      ${reasonHtml}
      <button class="btn order-btn" data-index="${index}" ${!check.available ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
        ${check.available ? 'Order Dish' : 'Unavailable'}
      </button>
    `;

    menuList.appendChild(card);
  });
}

function handleOrder(dishIndex) {
  const dish = recipesList[dishIndex];
  const check = checkDishAvailability(dish, stockList);

  if (!check.available) {
    alert(`Cannot order ${dish.dish}: ${check.reasons.join(', ')}`);
    return;
  }

  stockList = deductOrderFromStock(dish, stockList);
  logActivity(`Placed order for <span>${dish.dish}</span> (₹${dish.price}). Stock updated.`);

  updateUI();
}

function handleAdjustQty(index, delta) {
  const item = stockList[index];
  const newQty = Math.max(0, Number((item.qty + delta).toFixed(3)));
  stockList[index].qty = newQty;
  logActivity(`Adjusted <span>${item.name}</span> stock to ${newQty} ${item.unit}.`);
  updateUI();
}

function handleDeleteIngredient(index) {
  const item = stockList[index];
  const dependentDishes = recipesList
    .filter(r => r.ingredients.some(ing => ing.name.toLowerCase().trim() === item.name.toLowerCase().trim()))
    .map(r => r.dish);

  let confirmMsg = `Are you sure you want to delete "${item.name}" from stock?`;
  if (dependentDishes.length > 0) {
    confirmMsg = `"${item.name}" is used in: ${dependentDishes.join(', ')}.\nDeleting it will mark these dishes unavailable on the menu.\n\nDo you want to proceed with deletion?`;
  }

  if (confirm(confirmMsg)) {
    stockList.splice(index, 1);
    logActivity(`Deleted <span>${item.name}</span> from stock.`);
    updateUI();
  }
}

function openModal(index = -1) {
  editingIndex = index;
  modalErrors.classList.add('hidden');
  modalErrors.innerHTML = '';

  if (index === -1) {
    modalTitle.textContent = 'Add Ingredient';
    modalName.value = '';
    modalName.disabled = false;
    modalQty.value = '';
    modalUnit.value = 'kg';
    modalPar.value = '';
  } else {
    const item = stockList[index];
    modalTitle.textContent = `Edit Ingredient: ${item.name}`;
    modalName.value = item.name;
    modalName.disabled = false;
    modalQty.value = item.qty;
    modalUnit.value = item.unit;
    modalPar.value = item.par;
  }

  ingredientModal.classList.remove('hidden');
}

function closeModal() {
  ingredientModal.classList.add('hidden');
}

function handleFormSubmit(e) {
  e.preventDefault();

  const name = modalName.value.trim();
  const qty = parseFloat(modalQty.value);
  const unit = modalUnit.value.trim();
  const par = parseFloat(modalPar.value);

  const validation = validateIngredientForm(name, qty, unit, par, stockList, editingIndex);

  if (!validation.isValid) {
    modalErrors.innerHTML = validation.errors.map(err => `<div>• ${err}</div>`).join('');
    modalErrors.classList.remove('hidden');
    return;
  }

  if (editingIndex === -1) {
    stockList.push({ name, qty, unit, par });
    logActivity(`Added new ingredient: <span>${name}</span> (${qty} ${unit}, Par: ${par}).`);
  } else {
    stockList[editingIndex] = { name, qty, unit, par };
    logActivity(`Updated ingredient: <span>${name}</span> (Stock: ${qty} ${unit}, Par: ${par}).`);
  }

  closeModal();
  updateUI();
}

function logActivity(message) {
  const time = new Date().toLocaleTimeString();
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `[${time}] ${message}`;
  activityLog.prepend(div);
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderStockTable();
});

openAddModalBtn.addEventListener('click', () => openModal(-1));
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
ingredientForm.addEventListener('submit', handleFormSubmit);

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('order-btn')) {
    const index = parseInt(e.target.dataset.index, 10);
    handleOrder(index);
  }

  if (e.target.classList.contains('adjust-qty-btn')) {
    const index = parseInt(e.target.dataset.index, 10);
    const delta = parseFloat(e.target.dataset.delta);
    handleAdjustQty(index, delta);
  }

  if (e.target.classList.contains('edit-btn')) {
    const index = parseInt(e.target.dataset.index, 10);
    openModal(index);
  }

  if (e.target.classList.contains('delete-btn')) {
    const index = parseInt(e.target.dataset.index, 10);
    handleDeleteIngredient(index);
  }
});

loadInitialData();
