export function convertUnit(amount, fromUnit, toUnit) {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();

  if (from === to) return amount;

  if (from === 'kg' && to === 'g') return amount * 1000;
  if (from === 'g' && to === 'kg') return amount / 1000;
  if (from === 'l' && to === 'ml') return amount * 1000;
  if (from === 'ml' && to === 'l') return amount / 1000;

  return amount;
}

export function checkDishAvailability(dish, stockList) {
  const reasons = [];

  for (const ingredient of dish.ingredients) {
    const stockItem = stockList.find(
      item => item.name.toLowerCase().trim() === ingredient.name.toLowerCase().trim()
    );

    if (!stockItem) {
      reasons.push(`${ingredient.name} missing from stock`);
      continue;
    }

    if (stockItem.qty < stockItem.par) {
      reasons.push(`${ingredient.name} stock (${stockItem.qty} ${stockItem.unit}) below par (${stockItem.par} ${stockItem.unit})`);
    }
  }

  return {
    available: reasons.length === 0,
    reasons
  };
}

export function deductOrderFromStock(dish, stockList) {
  return stockList.map(item => {
    const needed = dish.ingredients.find(
      ing => ing.name.toLowerCase().trim() === item.name.toLowerCase().trim()
    );

    if (!needed) return { ...item };

    const deductAmount = convertUnit(needed.qty, needed.unit, item.unit);
    const newQty = Math.max(0, Number((item.qty - deductAmount).toFixed(3)));

    return { ...item, qty: newQty };
  });
}

export function validateIngredientForm(name, qty, unit, par, stockList, editIndex = -1) {
  const errors = [];
  const cleanName = (name || '').trim();

  if (!cleanName) {
    errors.push('Ingredient name is required');
  }

  const duplicate = stockList.findIndex(
    item => item.name.toLowerCase().trim() === cleanName.toLowerCase()
  );
  if (duplicate !== -1 && duplicate !== editIndex) {
    errors.push('An ingredient with this name already exists');
  }

  const numQty = Number(qty);
  if (isNaN(numQty) || numQty < 0) {
    errors.push('Quantity must be 0 or higher');
  }

  const numPar = Number(par);
  if (isNaN(numPar) || numPar < 0) {
    errors.push('Par level must be 0 or higher');
  }

  if (!unit || !unit.trim()) {
    errors.push('Unit is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
