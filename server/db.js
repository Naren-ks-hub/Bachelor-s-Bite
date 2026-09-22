const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'bachelor_bite.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  // 1. Leads Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Recipes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      badge TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      cook_time_min INTEGER NOT NULL,
      budget_inr INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      rating REAL NOT NULL,
      single_pan INTEGER DEFAULT 1,
      description TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      nutrition TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Collections Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      badge TEXT NOT NULL,
      description TEXT NOT NULL,
      recipe_count INTEGER NOT NULL,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Data if tables are empty
  seedData();
}

function seedData() {
  const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
  if (recipeCount === 0) {
    const insertRecipe = db.prepare(`
      INSERT INTO recipes (slug, title, badge, category, image, cook_time_min, budget_inr, difficulty, rating, single_pan, description, ingredients, steps, nutrition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialRecipes = [
      {
        slug: 'garlic-butter-chili-noodles',
        title: 'Garlic Butter Chili Noodles',
        badge: '🍝 Pasta',
        category: 'quick',
        image: 'images/recipe_noodles.jpg',
        cook_time_min: 12,
        budget_inr: 50,
        difficulty: 'Easy',
        rating: 4.8,
        single_pan: 1,
        description: 'Uses pasta, garlic, butter, and that leftover chili flake packet in your drawer.',
        ingredients: JSON.stringify(['Pasta', 'Garlic', 'Butter', 'Chili Flakes', 'Soy Sauce']),
        steps: JSON.stringify([
          { step: 1, instruction: 'Boil pasta in a single pan with water and salt until al dente (approx 7 mins), then drain and set aside.', timer_min: 7 },
          { step: 2, instruction: 'In the same pan, melt 2 tbsp butter over medium heat. Sauté 4 cloves of finely chopped garlic until aromatic and golden.', timer_min: 2 },
          { step: 3, instruction: 'Toss the boiled pasta into the fragrant garlic butter. Add 1 tsp chili flakes, 1 tbsp soy sauce, and stir-fry for 2 mins until well coated.', timer_min: 2 }
        ]),
        nutrition: JSON.stringify({ calories: 380, protein_g: 11, carbs_g: 54, fat_g: 14 })
      },
      {
        slug: 'crispy-egg-cheese-toast-fold',
        title: 'Crispy Egg & Cheese Toast Fold',
        badge: '🥚 Breakfast',
        category: 'quick',
        image: 'images/recipe_egg_toast.jpg',
        cook_time_min: 8,
        budget_inr: 45,
        difficulty: 'Easy',
        rating: 4.9,
        single_pan: 1,
        description: 'One skillet, 2 slices of stale bread, 2 beaten eggs, and gooey melted cheese.',
        ingredients: JSON.stringify(['Eggs', 'Cheese', 'Butter', 'Bread', 'Black Pepper']),
        steps: JSON.stringify([
          { step: 1, instruction: 'Crack 2 eggs into a bowl with a pinch of salt and black pepper; whisk vigorously with a fork.', timer_min: 1 },
          { step: 2, instruction: 'Melt 1 tbsp butter in a non-stick pan over medium heat. Pour in beaten eggs, then briefly dip both bread slices into egg and flip them over.', timer_min: 2 },
          { step: 3, instruction: 'Once the egg base is set, flip the entire egg and bread layer over in one swift move.', timer_min: 2 },
          { step: 4, instruction: 'Place a cheese slice in the center, fold excess egg edges inward, and fold bread into a crispy golden toasted sandwich.', timer_min: 2 }
        ]),
        nutrition: JSON.stringify({ calories: 410, protein_g: 22, carbs_g: 28, fat_g: 23 })
      },
      {
        slug: 'one-pan-smokey-black-bean-rice',
        title: 'One-Pan Smokey Black Bean Rice',
        badge: '🍚 Rice',
        category: 'budget',
        image: 'images/recipe_smokey_rice.jpg',
        cook_time_min: 15,
        budget_inr: 65,
        difficulty: 'Medium',
        rating: 4.7,
        single_pan: 1,
        description: 'Breathes fresh life into yesterday\'s cold takeout rice with cumin and black beans.',
        ingredients: JSON.stringify(['Rice', 'Garlic', 'Onions', 'Vegetables', 'Butter']),
        steps: JSON.stringify([
          { step: 1, instruction: 'Melt butter or heat 1 tbsp oil in pan. Sauté chopped onions and minced garlic for 2 minutes until translucent.', timer_min: 2 },
          { step: 2, instruction: 'Add chopped vegetables, cooked beans, 1/2 tsp cumin, and pinch of chili powder; sauté for 3 minutes.', timer_min: 3 },
          { step: 3, instruction: 'Add 1.5 cups cooked rice, 2 tbsp water, mix thoroughly, cover pan and steam on low flame for 5 minutes.', timer_min: 5 }
        ]),
        nutrition: JSON.stringify({ calories: 460, protein_g: 15, carbs_g: 72, fat_g: 12 })
      },
      {
        slug: 'high-protein-chicken-skillet',
        title: 'High Protein Garlic Herb Chicken Skillet',
        badge: '💪 Protein',
        category: 'protein',
        image: 'images/collection_protein.jpg',
        cook_time_min: 14,
        budget_inr: 110,
        difficulty: 'Easy',
        rating: 4.9,
        single_pan: 1,
        description: 'Juicy seared chicken breast cubes tossed with garlic, butter, and black pepper.',
        ingredients: JSON.stringify(['Chicken', 'Garlic', 'Butter', 'Vegetables', 'Black Pepper']),
        steps: JSON.stringify([
          { step: 1, instruction: 'Cut chicken breast into bite-sized 1-inch cubes; season with salt and crushed black pepper.', timer_min: 2 },
          { step: 2, instruction: 'Heat butter in a skillet over high heat; sear chicken cubes undisturbed for 4 mins to get a golden crust.', timer_min: 4 },
          { step: 3, instruction: 'Flip chicken, add minced garlic and mixed vegetables; stir-fry for 4 mins until chicken is cooked through and succulent.', timer_min: 4 }
        ]),
        nutrition: JSON.stringify({ calories: 490, protein_g: 44, carbs_g: 8, fat_g: 22 })
      },
      {
        slug: 'single-skillet-egg-fried-rice',
        title: 'Quick 10-Minute Egg Fried Rice',
        badge: '⚡ Quick',
        category: 'quick',
        image: 'images/collection_quick.jpg',
        cook_time_min: 10,
        budget_inr: 55,
        difficulty: 'Easy',
        rating: 4.8,
        single_pan: 1,
        description: 'Street-style fried rice with scrambled eggs, onions, and soy sauce in 10 minutes flat.',
        ingredients: JSON.stringify(['Rice', 'Eggs', 'Onions', 'Garlic', 'Butter', 'Vegetables']),
        steps: JSON.stringify([
          { step: 1, instruction: 'Sauté chopped onions and minced garlic in melted butter over high flame for 2 minutes.', timer_min: 2 },
          { step: 2, instruction: 'Push veggies to one side of the pan, crack in 2 eggs, and scramble quickly for 1 minute.', timer_min: 1 },
          { step: 3, instruction: 'Toss in cold cooked rice, soy sauce, and black pepper; stir-fry continuously on high heat for 3 minutes.', timer_min: 3 }
        ]),
        nutrition: JSON.stringify({ calories: 430, protein_g: 18, carbs_g: 58, fat_g: 14 })
      },
      {
        slug: 'midnight-garlic-cheese-melt',
        title: 'Midnight Garlic & Cheese Pan Melt',
        badge: '🌙 Midnight',
        category: 'midnight',
        image: 'images/collection_midnight.jpg',
        cook_time_min: 7,
        budget_inr: 40,
        difficulty: 'Easy',
        rating: 4.9,
        single_pan: 1,
        description: 'Silent, gooey midnight comfort snack made in minutes with bread, garlic butter, and cheese.',
        ingredients: JSON.stringify(['Cheese', 'Garlic', 'Butter', 'Bread']),
        steps: JSON.stringify([
          { step: 1, instruction: 'Mix 1 tbsp soft butter with finely grated garlic and a dash of oregano/chili flakes.', timer_min: 1 },
          { step: 2, instruction: 'Spread garlic butter onto outer sides of bread, layer thick cheese inside.', timer_min: 1 },
          { step: 3, instruction: 'Toast on low-medium flame in a covered pan for 2.5 mins per side until bread is crunch-crisp and cheese is molten.', timer_min: 5 }
        ]),
        nutrition: JSON.stringify({ calories: 350, protein_g: 13, carbs_g: 26, fat_g: 22 })
      }
    ];

    for (const r of initialRecipes) {
      insertRecipe.run(
        r.slug, r.title, r.badge, r.category, r.image,
        r.cook_time_min, r.budget_inr, r.difficulty, r.rating, r.single_pan,
        r.description, r.ingredients, r.steps, r.nutrition
      );
    }
  }

  const collectionCount = db.prepare('SELECT COUNT(*) as count FROM collections').get().count;
  if (collectionCount === 0) {
    const insertCollection = db.prepare(`
      INSERT INTO collections (slug, title, badge, description, recipe_count, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const initialCollections = [
      {
        slug: 'broke-edition',
        title: 'End-of-Month Broke Edition',
        badge: '💰 Budget',
        description: 'Meals when your bank account is low but you refuse to eat plain tap water ramen.',
        recipe_count: 24,
        image: 'images/collection_budget.jpg'
      },
      {
        slug: 'hangry-meals',
        title: '10-Minute Hangry Meals',
        badge: '⚡ Quick',
        description: 'Faster than putting your shoes on to walk to the deli or waiting 50 mins on delivery.',
        recipe_count: 18,
        image: 'images/collection_quick.jpg'
      },
      {
        slug: 'single-skillet-gains',
        title: 'Single Skillet Gains',
        badge: '💪 Protein',
        description: 'High protein macros for gym rats who despise Sunday batch-prepping 14 tubs.',
        recipe_count: 22,
        image: 'images/collection_protein.jpg'
      },
      {
        slug: 'midnight-study',
        title: 'Late Night Study Cravings',
        badge: '🌙 Study',
        description: 'Silent, low-smell midnight snacks you can whip up without waking your roommate.',
        recipe_count: 16,
        image: 'images/collection_midnight.jpg'
      }
    ];

    for (const c of initialCollections) {
      insertCollection.run(c.slug, c.title, c.badge, c.description, c.recipe_count, c.image);
    }
  }
}

// Database helper queries
const dbQueries = {
  // Leads
  createLead: (name, email, phone) => {
    const stmt = db.prepare('INSERT INTO leads (name, email, phone) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, phone);
    return { id: result.lastInsertRowid, name, email, phone };
  },
  getLeadByEmail: (email) => {
    return db.prepare('SELECT * FROM leads WHERE email = ?').get(email);
  },
  getAllLeads: () => {
    return db.prepare('SELECT id, name, email, phone, status, created_at FROM leads ORDER BY created_at DESC').all();
  },

  // Recipes
  getAllRecipes: () => {
    const rows = db.prepare('SELECT * FROM recipes ORDER BY rating DESC').all();
    return rows.map(formatRecipe);
  },
  getRecipeByIdOrSlug: (idOrSlug) => {
    let row;
    if (isNaN(idOrSlug)) {
      row = db.prepare('SELECT * FROM recipes WHERE slug = ?').get(idOrSlug);
    } else {
      row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(Number(idOrSlug));
    }
    return row ? formatRecipe(row) : null;
  },
  getRecipesByCategory: (category) => {
    const rows = db.prepare('SELECT * FROM recipes WHERE category = ? ORDER BY rating DESC').all(category);
    return rows.map(formatRecipe);
  },

  // Collections
  getAllCollections: () => {
    return db.prepare('SELECT * FROM collections ORDER BY id ASC').all();
  }
};

function formatRecipe(row) {
  return {
    ...row,
    single_pan: Boolean(row.single_pan),
    ingredients: JSON.parse(row.ingredients || '[]'),
    steps: JSON.parse(row.steps || '[]'),
    nutrition: JSON.parse(row.nutrition || '{}')
  };
}

module.exports = {
  db,
  initDatabase,
  dbQueries
};
