import test from 'node:test';
import assert from 'node:assert/strict';
import { convertUnit, checkDishAvailability, deductOrderFromStock, validateIngredientForm } from './domain.js';

test('unit conversion math', () => {
  assert.equal(convertUnit(1.4, 'kg', 'g'), 1400);
  assert.equal(convertUnit(180, 'g', 'kg'), 0.18);
  assert.equal(convertUnit(1, 'l', 'ml'), 1000);
  assert.equal(convertUnit(500, 'ml', 'l'), 0.5);
  assert.equal(convertUnit(10, 'g', 'g'), 10);
});

test('dish availability based on par levels', () => {
  const stock = [
    { name: 'Paneer', qty: 1.4, unit: 'kg', par: 0.5 },
    { name: 'Tomatoes', qty: 6, unit: 'kg', par: 1.5 },
    { name: 'Onions', qty: 8, unit: 'kg', par: 2 },
    { name: 'Cream', qty: 900, unit: 'ml', par: 300 },
    { name: 'Butter', qty: 900, unit: 'g', par: 200 },
    { name: 'Cashews', qty: 300, unit: 'g', par: 250 },
    { name: 'Garam Masala', qty: 250, unit: 'g', par: 50 }
  ];

  const recipe = {
    dish: 'Paneer Butter Masala',
    price: 320,
    ingredients: [
      { name: 'Paneer', qty: 180, unit: 'g' },
      { name: 'Tomatoes', qty: 150, unit: 'g' },
      { name: 'Onions', qty: 80, unit: 'g' },
      { name: 'Cream', qty: 40, unit: 'ml' },
      { name: 'Butter', qty: 30, unit: 'g' },
      { name: 'Cashews', qty: 15, unit: 'g' },
      { name: 'Garam Masala', qty: 5, unit: 'g' }
    ]
  };

  const check1 = checkDishAvailability(recipe, stock);
  assert.equal(check1.available, true);

  const lowStock = stock.map(item =>
    item.name === 'Paneer' ? { ...item, qty: 0.4 } : item
  );

  const check2 = checkDishAvailability(recipe, lowStock);
  assert.equal(check2.available, false);
  assert.equal(check2.reasons.length, 1);
});

test('missing ingredients from stock make dish unavailable', () => {
  const stock = [
    { name: 'Basmati Rice', qty: 12, unit: 'kg', par: 3 },
    { name: 'Ghee', qty: 800, unit: 'ml', par: 200 }
  ];

  const recipe = {
    dish: 'Jeera Rice',
    price: 180,
    ingredients: [
      { name: 'Basmati Rice', qty: 150, unit: 'g' },
      { name: 'Ghee', qty: 15, unit: 'ml' },
      { name: 'Cumin Seeds', qty: 5, unit: 'g' }
    ]
  };

  const check = checkDishAvailability(recipe, stock);
  assert.equal(check.available, false);
});

test('stock deduction on order', () => {
  const stock = [
    { name: 'Paneer', qty: 1.4, unit: 'kg', par: 0.5 },
    { name: 'Tomatoes', qty: 6, unit: 'kg', par: 1.5 }
  ];

  const recipe = {
    dish: 'Paneer Dish',
    ingredients: [
      { name: 'Paneer', qty: 180, unit: 'g' },
      { name: 'Tomatoes', qty: 500, unit: 'g' }
    ]
  };

  const nextStock = deductOrderFromStock(recipe, stock);
  const paneer = nextStock.find(i => i.name === 'Paneer');
  const tomatoes = nextStock.find(i => i.name === 'Tomatoes');

  assert.equal(paneer.qty, 1.22);
  assert.equal(tomatoes.qty, 5.5);
});

test('ingredient form validation', () => {
  const stock = [{ name: 'Paneer', qty: 1, unit: 'kg', par: 0.5 }];

  assert.equal(validateIngredientForm('', 5, 'g', 1, stock).isValid, false);
  assert.equal(validateIngredientForm('Salt', -2, 'g', 1, stock).isValid, false);
  assert.equal(validateIngredientForm('Paneer', 5, 'kg', 1, stock).isValid, false);
  assert.equal(validateIngredientForm('Paneer', 5, 'kg', 1, stock, 0).isValid, true);
});
