/**
 * BachelorBite - Automated Grocery List & Budget Engine
 * Compares required recipe ingredients against user's pantry to isolate missing items,
 * groups them by category, and calculates budget-aware estimated grocery costs.
 */

// Estimated budget-friendly bachelor item costs in INR (₹)
export const INGREDIENT_COST_CATALOG = {
  'bread': { cost: 20, category: 'Pantry Staples', unit: '1 loaf' },
  'eggs': { cost: 15, category: 'Dairy & Protein', unit: '2-4 pcs' },
  'milk': { cost: 30, category: 'Dairy & Protein', unit: '500ml' },
  'cheese': { cost: 25, category: 'Dairy & Protein', unit: '100g / slices' },
  'butter': { cost: 15, category: 'Dairy & Protein', unit: '50g' },
  'paneer': { cost: 45, category: 'Dairy & Protein', unit: '200g' },
  'chicken': { cost: 65, category: 'Dairy & Protein', unit: '250g breast' },
  'pasta': { cost: 25, category: 'Pantry Staples', unit: '1 pack' },
  'noodles': { cost: 20, category: 'Pantry Staples', unit: '1 pack' },
  'rice': { cost: 20, category: 'Pantry Staples', unit: '500g' },
  'oats': { cost: 25, category: 'Pantry Staples', unit: '200g' },
  'chickpeas / beans': { cost: 25, category: 'Pantry Staples', unit: '1 can / 250g' },
  'beans': { cost: 25, category: 'Pantry Staples', unit: '1 can / 250g' },
  'garlic': { cost: 10, category: 'Fresh Produce', unit: '1 bulb' },
  'onions': { cost: 15, category: 'Fresh Produce', unit: '250g' },
  'vegetables': { cost: 25, category: 'Fresh Produce', unit: 'Mixed veggies' },
  'tomatoes': { cost: 15, category: 'Fresh Produce', unit: '250g' },
  'spinach': { cost: 15, category: 'Fresh Produce', unit: '1 bunch' },
  'soy sauce': { cost: 15, category: 'Spices & Sauces', unit: 'Small bottle' },
  'chili flakes': { cost: 10, category: 'Spices & Sauces', unit: '1 sachet / jar' },
  'black pepper': { cost: 10, category: 'Spices & Sauces', unit: '1 shaker' },
  'peanut butter': { cost: 35, category: 'Spices & Sauces', unit: '100g tub' }
};

/**
 * Categorize ingredient name into standard grocery store aisles.
 * @param {string} ingredientName
 * @returns {string} Category name
 */
export function categorizeIngredient(ingredientName) {
  const lower = String(ingredientName).toLowerCase().trim();
  for (const [key, data] of Object.entries(INGREDIENT_COST_CATALOG)) {
    if (lower.includes(key) || key.includes(lower)) {
      return data.category;
    }
  }
  if (lower.includes('sauce') || lower.includes('spice') || lower.includes('pepper') || lower.includes('oil')) {
    return 'Spices & Sauces';
  }
  if (lower.includes('egg') || lower.includes('milk') || lower.includes('curd') || lower.includes('cheese') || lower.includes('paneer')) {
    return 'Dairy & Protein';
  }
  if (lower.includes('onion') || lower.includes('garlic') || lower.includes('veg') || lower.includes('tomato') || lower.includes('herb')) {
    return 'Fresh Produce';
  }
  return 'Pantry Staples';
}

/**
 * Look up estimated grocery item cost (INR).
 * @param {string} ingredientName
 * @returns {number} Estimated cost in INR
 */
export function getEstimatedCost(ingredientName) {
  const lower = String(ingredientName).toLowerCase().trim();
  for (const [key, data] of Object.entries(INGREDIENT_COST_CATALOG)) {
    if (lower.includes(key) || key.includes(lower)) {
      return data.cost;
    }
  }
  return 20; // Default budget estimate
}

/**
 * Requirement 1: Recipe-to-Pantry Comparison Logic
 * Compares required ingredients in a recipe against the user's active pantry list
 * to isolate missing items.
 *
 * @param {Array<string>|Object} recipeOrIngredients - Recipe object or array of ingredients
 * @param {Array<string|Object>} pantryItems - User's pantry items (objects with .name or strings)
 * @returns {{
 *   missingItems: Array<{ id: string, name: string, category: string, estimatedCost: number, checked: boolean, recipeSource?: string }>,
 *   matchedItems: Array<string>,
 *   totalEstimatedCost: number,
 *   groupedMissing: Object
 * }}
 */
export function generateMissingGroceryList(recipeOrIngredients, pantryItems = []) {
  const ingredients = Array.isArray(recipeOrIngredients)
    ? recipeOrIngredients
    : (recipeOrIngredients.ingredients || []);

  const recipeTitle = (!Array.isArray(recipeOrIngredients) && recipeOrIngredients.title)
    ? recipeOrIngredients.title
    : 'Selected Meal';

  // Normalize user's current pantry items
  const pantryNames = pantryItems.map(item => {
    if (typeof item === 'string') return item.toLowerCase().trim();
    return (item.name || '').toLowerCase().trim();
  }).filter(Boolean);

  const missingItems = [];
  const matchedItems = [];

  for (const required of ingredients) {
    const reqClean = String(required).trim();
    const reqLower = reqClean.toLowerCase();

    // Check if ingredient exists in pantry
    const inPantry = pantryNames.some(pantryName =>
      pantryName.includes(reqLower) || reqLower.includes(pantryName)
    );

    if (inPantry) {
      matchedItems.push(reqClean);
    } else {
      const category = categorizeIngredient(reqClean);
      const estimatedCost = getEstimatedCost(reqClean);
      missingItems.push({
        id: `missing_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: reqClean,
        category,
        estimatedCost,
        checked: false,
        recipeSource: recipeTitle
      });
    }
  }

  // Calculate total estimated budget cost
  const totalEstimatedCost = missingItems.reduce((sum, item) => sum + item.estimatedCost, 0);

  // Group items logically by category
  const groupedMissing = missingItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return {
    missingItems,
    matchedItems,
    totalEstimatedCost,
    groupedMissing
  };
}

/**
 * Merge new missing items into an existing grocery list without duplicates.
 *
 * @param {Array} existingList
 * @param {Array} newItems
 * @returns {Array} Combined grocery list
 */
export function mergeGroceryItems(existingList = [], newItems = []) {
  const result = [...existingList];
  for (const newItem of newItems) {
    const exists = result.some(item =>
      item.name.toLowerCase().trim() === newItem.name.toLowerCase().trim()
    );
    if (!exists) {
      result.push(newItem);
    }
  }
  return result;
}
