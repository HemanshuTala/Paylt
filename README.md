# Palyt Kitchen Stock & Menu Task

A simple web app built with vanilla JavaScript and HTML to connect kitchen inventory with live menu availability.

## Running the App & Tests

### 1. Run Unit Tests
```bash
npm test
```

### 2. Open the App
You can start a local dev server:
```bash
npm start
```
And open `http://localhost:8080` in your browser. Or simply open `index.html` directly in your browser.

---

## Write-Up

### 1. The Calls I Made
- **Missing Stock Items**: Ingredients like `Cumin Seeds` and `Refined Flour` were in `recipes.json` but missing in `stock.json`. I treated missing items as zero stock, so dishes needing them (`Veg Pulao`, `Jeera Rice`, `Butter Naan`) start as Unavailable until you add those ingredients to stock.
- **Unit Conversions**: Stock is in purchasing units (`kg`, `l`) while recipes use cooking units (`g`, `ml`). I built simple conversion math so `1.4 kg` minus `180 g` cleanly leaves `1.22 kg`.
- **Deleting Ingredients**: If you delete an ingredient used in dishes (like `Cashews`), a confirmation prompt pops up letting you know which dishes will become unavailable. If you delete an unused item (like `Bay Leaves`), it deletes right away.

### 2. How I Checked
- **Hand Math**:
  - Paneer stock starts at 1.4 kg (1400 g), par is 0.5 kg (500 g).
  - Ordering 1 Paneer Butter Masala deducts 180 g -> 1.22 kg left (still available).
  - Ordering more until stock drops below 0.5 kg causes the dish to turn Unavailable.
- **Unit Tests**: Ran `npm test` to verify unit conversions (`kg` to `g`, `l` to `ml`), ingredient deductions, par boundary checks, and form validation.

### 3. Product Availability Rule Feedback
The task spec says: *"A dish is unavailable when any ingredient it uses has fallen below its par level."*

In a real kitchen, par level is a reorder buffer ("buy more soon"), not zero stock. If Paneer par is 0.5 kg and we have 0.42 kg in stock, we still have enough to cook 2 portions (180 g each). Blocking the dish at 0.42 kg wastes cookable food and hurts sales.

**Better approach**:
1. Show a **Reorder Alert** in the kitchen when stock drops below par.
2. Mark the dish **Unavailable** on the diner menu only when physical stock drops below what's actually needed for 1 portion (or 0).

### 4. What I'd Build Next ("Another Day")
- Support multi-quantity ordering (ordering 2 or 3 portions at once).
- Save stock changes to localStorage or a simple JSON backend.
- Add a recipe editor to adjust portion sizes or add new dishes.
