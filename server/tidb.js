const mysql = require('mysql2/promise');

let pool = null;
let isConnected = false;

function isTiDBConfigured() {
  const host = process.env.TIDB_HOST;
  const user = process.env.TIDB_USER;
  const pass = process.env.TIDB_PASSWORD;
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && !dbUrl.includes('<username>')) return true;
  if (!host || !user || !pass) return false;
  if (user === 'your_tidb_user' || user === 'your_tidb_username') return false;
  if (pass === 'your_tidb_password') return false;
  return true;
}

function getTiDBPool() {
  if (pool) return pool;

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('<username>')) {
    pool = mysql.createPool(process.env.DATABASE_URL);
    return pool;
  }

  const host = process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const port = Number(process.env.TIDB_PORT) || 4000;
  const user = process.env.TIDB_USER;
  const password = process.env.TIDB_PASSWORD;
  const database = process.env.TIDB_DATABASE || 'bachelor_bite';
  const enableSSL = process.env.TIDB_ENABLE_SSL !== 'false';

  const config = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  if (enableSSL) {
    config.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    };
  }

  pool = mysql.createPool(config);
  return pool;
}

async function ensureTiDBDatabase() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('<username>')) return;
  const host = process.env.TIDB_HOST;
  const port = Number(process.env.TIDB_PORT) || 4000;
  const user = process.env.TIDB_USER;
  const password = process.env.TIDB_PASSWORD;
  const database = process.env.TIDB_DATABASE || 'bachelors-bite';
  const enableSSL = process.env.TIDB_ENABLE_SSL !== 'false';

  try {
    const bootstrapConfig = {
      host,
      port,
      user,
      password,
      database: 'test'
    };
    if (enableSSL) {
      bootstrapConfig.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
    }
    const bootstrapConn = await mysql.createConnection(bootstrapConfig);
    const escapedDb = '`' + database.replace(/`/g, '``') + '`';
    await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS ${escapedDb};`);
    await bootstrapConn.end();
  } catch (err) {
    // Proceed if 'test' db does not exist or user lacks permission
  }
}

async function initTiDBDatabase() {
  if (!isTiDBConfigured()) {
    console.log('ℹ️  TiDB Cloud credentials not fully set in .env.local; using local database engine.');
    return false;
  }

  try {
    await ensureTiDBDatabase();
    const currentPool = getTiDBPool();
    const conn = await currentPool.getConnection();
    console.log('⚡ Connected to TiDB Cloud successfully!');
    isConnected = true;

    // 1. Users Table (Native Auth replacing Firebase)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Leads Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Recipes Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        badge VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image VARCHAR(255) NOT NULL,
        cook_time_min INT NOT NULL,
        budget_inr INT NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        rating FLOAT NOT NULL,
        single_pan TINYINT DEFAULT 1,
        description TEXT NOT NULL,
        ingredients JSON NOT NULL,
        steps JSON NOT NULL,
        nutrition JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Collections Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        badge VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        recipe_count INT NOT NULL,
        image VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed recipes if empty
    const [recipeRows] = await conn.query('SELECT COUNT(*) as count FROM recipes');
    if (recipeRows[0].count < 9) {
      console.log('🌱 Seeding initial recipes to TiDB Cloud...');
      const initialRecipes = [
        [
          'garlic-butter-chili-noodles',
          'Garlic Butter Chili Noodles',
          '🍝 Pasta',
          'quick',
          'images/recipe_noodles.jpg',
          12,
          50,
          'Easy',
          4.8,
          1,
          'Uses pasta, garlic, butter, and that leftover chili flake packet in your drawer.',
          JSON.stringify(['Pasta', 'Garlic', 'Butter', 'Chili Flakes', 'Soy Sauce']),
          JSON.stringify([
            { step: 1, instruction: 'Boil pasta in a single pan with water and salt until al dente (approx 7 mins), then drain and set aside.' },
            { step: 2, instruction: 'In the same pan, melt 2 tbsp butter over medium heat. Sauté 4 cloves of finely chopped garlic until aromatic and golden.' },
            { step: 3, instruction: 'Toss the boiled pasta into the fragrant garlic butter. Add 1 tsp chili flakes, 1 tbsp soy sauce, and stir-fry for 2 mins until well coated.' }
          ]),
          JSON.stringify({ calories: 380, protein_g: 11, carbs_g: 54, fat_g: 14 })
        ],
        [
          'crispy-egg-cheese-toast-fold',
          'Crispy Egg & Cheese Toast Fold',
          '🥚 Breakfast',
          'quick',
          'images/recipe_egg_toast.jpg',
          8,
          45,
          'Easy',
          4.9,
          1,
          'One skillet, 2 slices of stale bread, 2 beaten eggs, and gooey melted cheese.',
          JSON.stringify(['Eggs', 'Cheese', 'Butter', 'Bread', 'Black Pepper']),
          JSON.stringify([
            { step: 1, instruction: 'Crack 2 eggs into a bowl with a pinch of salt and black pepper; whisk vigorously with a fork.' },
            { step: 2, instruction: 'Melt 1 tbsp butter in a non-stick pan over medium heat. Pour in beaten eggs, then briefly dip both bread slices into egg and flip them over.' },
            { step: 3, instruction: 'Once the egg base is set, flip the entire egg and bread layer over in one swift move.' },
            { step: 4, instruction: 'Place a cheese slice in the center, fold excess egg edges inward, and fold bread into a crispy golden toasted sandwich.' }
          ]),
          JSON.stringify({ calories: 410, protein_g: 22, carbs_g: 28, fat_g: 23 })
        ],
        [
          'one-pan-smokey-black-bean-rice',
          'One-Pan Smokey Bean Rice',
          '🍚 Rice',
          'veg',
          'images/recipe_smokey_rice.jpg',
          15,
          65,
          'Medium',
          4.7,
          1,
          'Breathes fresh life into yesterday\'s cold takeout rice with onions, spices and beans.',
          JSON.stringify(['Rice', 'Garlic', 'Onions', 'Vegetables', 'Butter']),
          JSON.stringify([
            { step: 1, instruction: 'Melt butter or heat 1 tbsp oil in pan. Sauté chopped onions and minced garlic for 2 minutes until translucent.' },
            { step: 2, instruction: 'Add chopped vegetables, cooked beans, 1/2 tsp cumin, and pinch of chili powder; sauté for 3 minutes.' },
            { step: 3, instruction: 'Add 1.5 cups cooked rice, 2 tbsp water, mix thoroughly, cover pan and steam on low flame for 5 minutes.' }
          ]),
          JSON.stringify({ calories: 460, protein_g: 15, carbs_g: 72, fat_g: 12 })
        ],
        [
          'high-protein-chicken-skillet',
          'High Protein Garlic Herb Chicken Skillet',
          '💪 Protein',
          'protein',
          'images/collection_protein.jpg',
          14,
          110,
          'Easy',
          4.9,
          1,
          'Juicy seared chicken breast cubes tossed with garlic, butter, and black pepper.',
          JSON.stringify(['Chicken', 'Garlic', 'Butter', 'Vegetables', 'Black Pepper']),
          JSON.stringify([
            { step: 1, instruction: 'Cut chicken breast into bite-sized 1-inch cubes; season with salt and crushed black pepper.' },
            { step: 2, instruction: 'Heat butter in a skillet over high heat; sear chicken cubes undisturbed for 4 mins to get a golden crust.' },
            { step: 3, instruction: 'Flip chicken, add minced garlic and mixed vegetables; stir-fry for 4 mins until chicken is cooked through and succulent.' }
          ]),
          JSON.stringify({ calories: 490, protein_g: 44, carbs_g: 8, fat_g: 22 })
        ],
        [
          'single-skillet-egg-fried-rice',
          'Quick 10-Minute Egg Fried Rice',
          '⚡ Quick',
          'quick',
          'images/collection_quick.jpg',
          10,
          55,
          'Easy',
          4.8,
          1,
          'Street-style fried rice with scrambled eggs, onions, and soy sauce in 10 minutes flat.',
          JSON.stringify(['Rice', 'Eggs', 'Onions', 'Garlic', 'Butter', 'Vegetables']),
          JSON.stringify([
            { step: 1, instruction: 'Sauté chopped onions and minced garlic in melted butter over high flame for 2 minutes.' },
            { step: 2, instruction: 'Push veggies to one side of the pan, crack in 2 eggs, and scramble quickly for 1 minute.' },
            { step: 3, instruction: 'Toss in cold cooked rice, soy sauce, and black pepper; stir-fry continuously on high heat for 3 minutes.' }
          ]),
          JSON.stringify({ calories: 430, protein_g: 18, carbs_g: 58, fat_g: 14 })
        ],
        [
          'midnight-garlic-cheese-melt',
          'Midnight Garlic & Cheese Pan Melt',
          '🌙 Midnight',
          'quick',
          'images/collection_midnight.jpg',
          6,
          40,
          'Easy',
          4.9,
          1,
          'Crispy crust with molten garlic-herb cheese center for late study or work nights.',
          JSON.stringify(['Bread', 'Cheese', 'Garlic', 'Butter', 'Chili Flakes']),
          JSON.stringify([
            { step: 1, instruction: 'Spread butter mixed with minced garlic on outer sides of two bread slices.' },
            { step: 2, instruction: 'Generously layer cheese slices and chili flakes between bread.' },
            { step: 3, instruction: 'Toast on a warm pan for 3 mins per side until golden brown and cheese is fully melted.' }
          ]),
          JSON.stringify({ calories: 370, protein_g: 14, carbs_g: 32, fat_g: 21 })
        ],
        [
          'peanut-sesame-chili-noodles',
          '10-Min Peanut Sesame Chili Noodles',
          '🌱 Vegan',
          'vegan',
          'images/collection_vegan.jpg',
          10,
          45,
          'Easy',
          4.8,
          1,
          'Rich nutty sesame-peanut glaze tossed with noodles, soy sauce, and garlic for an instant vegan dinner.',
          JSON.stringify(['Pasta', 'Peanut Butter', 'Garlic', 'Soy Sauce', 'Chili Flakes']),
          JSON.stringify([
            { step: 1, instruction: 'Boil noodles or pasta in a single pan for 6 mins until tender; reserve 2 tbsp cooking water, then drain.' },
            { step: 2, instruction: 'In the warm pan, whisk 1.5 tbsp peanut butter, 1 tbsp soy sauce, minced garlic, chili flakes, and the 2 tbsp reserved water into a creamy sauce.' },
            { step: 3, instruction: 'Toss warm noodles vigorously into the peanut sauce over low flame for 2 mins until glossy and fully coated.' }
          ]),
          JSON.stringify({ calories: 410, protein_g: 14, carbs_g: 58, fat_g: 15 })
        ],
        [
          'crispy-chickpea-veggie-skillet',
          'Crispy Spiced Chickpea & Veggie Bowl',
          '🌾 Fiber',
          'fiber',
          'images/collection_fiber.jpg',
          12,
          50,
          'Easy',
          4.9,
          1,
          'High-fiber powerhouse packed with sautéed chickpeas, onions, crisp veggies, and aromatic cumin paprika seasoning.',
          JSON.stringify(['Chickpeas / Beans', 'Vegetables', 'Garlic', 'Onions', 'Butter', 'Chili Flakes']),
          JSON.stringify([
            { step: 1, instruction: 'Rinse and drain cooked chickpeas; pat lightly dry with a towel or paper napkin.' },
            { step: 2, instruction: 'Melt 1 tbsp butter in a pan over medium-high heat. Add minced garlic, chopped onions, and chickpeas with a pinch of salt and chili flakes.' },
            { step: 3, instruction: 'Toss in chopped vegetables and sauté for 5 mins until chickpeas are crunchy-crisp on the edges and veggies are tender-crisp.' }
          ]),
          JSON.stringify({ calories: 370, protein_g: 16, carbs_g: 48, fat_g: 12 })
        ],
        [
          'korean-honey-garlic-toast',
          'Korean Street Honey Garlic Cheese Toast',
          '🌍 Street Bites',
          'street',
          'images/collection_global.jpg',
          8,
          40,
          'Easy',
          4.9,
          1,
          'Seoul street-food favorite with crusty pan-toasted bread slathered in sweet savory garlic butter and melted cheese.',
          JSON.stringify(['Bread', 'Butter', 'Garlic', 'Cheese', 'Soy Sauce']),
          JSON.stringify([
            { step: 1, instruction: 'Mix 1.5 tbsp softened butter with 2 minced garlic cloves, 1/2 tsp sugar/honey, and 3 drops of soy sauce.' },
            { step: 2, instruction: 'Slather the garlic mixture generously on both sides of bread slices and place cheese in between.' },
            { step: 3, instruction: 'Pan fry in a covered skillet on low heat for 2 mins per side until deeply golden, caramelized, and cheese stretches.' }
          ]),
          JSON.stringify({ calories: 340, protein_g: 11, carbs_g: 38, fat_g: 16 })
        ]
      ];

      for (const r of initialRecipes) {
        await conn.query(`
          INSERT IGNORE INTO recipes (slug, title, badge, category, image, cook_time_min, budget_inr, difficulty, rating, single_pan, description, ingredients, steps, nutrition)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, r);
      }
    }

    // Seed collections if empty
    const [collRows] = await conn.query('SELECT COUNT(*) as count FROM collections');
    if (collRows[0].count < 7) {
      console.log('🌱 Seeding situational collections to TiDB Cloud...');
      const initialCollections = [
        ['broke-edition', 'End-of-Month Broke Edition', '💰 Budget', 'Meals when your bank account is low but you refuse to eat plain tap water ramen.', 24, 'images/collection_budget.jpg'],
        ['hangry-meals', '10-Minute Hangry Meals', '⚡ Quick', 'Faster than putting your shoes on to walk to the deli or waiting 50 mins on delivery.', 18, 'images/collection_quick.jpg'],
        ['single-skillet-gains', 'Single Skillet Gains', '💪 Protein', 'High protein macros for gym rats who despise Sunday batch-prepping 14 tubs.', 22, 'images/collection_protein.jpg'],
        ['midnight-study', 'Late Night Study Cravings', '🌙 Study', 'Silent, low-smell midnight snacks you can whip up without waking your roommate.', 16, 'images/collection_midnight.jpg'],
        ['vegan-express', 'Plant-Powered Vegan Express', '🌱 Vegan', 'Zero animal products, 100% quick and budget-friendly single-pot meals.', 16, 'images/collection_vegan.jpg'],
        ['gut-reset-fiber', 'High-Fiber & Gut Reset', '🌾 Fiber', 'Oats, lentils, beans, and greens to keep digestion sharp and energy consistent.', 14, 'images/collection_fiber.jpg'],
        ['global-street-bites', 'Global Street Bites', '🌍 Street Bites', 'Bold international street foods adapted for single-skillet bachelor setups.', 20, 'images/collection_global.jpg']
      ];

      for (const c of initialCollections) {
        await conn.query(`
          INSERT IGNORE INTO collections (slug, title, badge, description, recipe_count, image)
          VALUES (?, ?, ?, ?, ?, ?)
        `, c);
      }
    }

    conn.release();
    return true;
  } catch (err) {
    console.error('⚠️  Failed to initialize TiDB Cloud:', err.message);
    isConnected = false;
    return false;
  }
}

const tidbQueries = {
  // Users
  createUser: async (name, email, passwordHash, phone) => {
    const [result] = await getTiDBPool().query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, phone || '']
    );
    return { id: result.insertId, name, email, phone };
  },

  getUserByEmail: async (email) => {
    const [rows] = await getTiDBPool().query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  // Leads
  createLead: async (name, email, phone) => {
    const [result] = await getTiDBPool().query(
      'INSERT INTO leads (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );
    return { id: result.insertId, name, email, phone };
  },

  getLeadByEmail: async (email) => {
    const [rows] = await getTiDBPool().query('SELECT * FROM leads WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  getAllLeads: async () => {
    const [rows] = await getTiDBPool().query('SELECT id, name, email, phone, status, created_at FROM leads ORDER BY created_at DESC');
    return rows;
  },

  // Recipes
  getAllRecipes: async () => {
    const [rows] = await getTiDBPool().query('SELECT * FROM recipes ORDER BY rating DESC');
    return rows.map(formatTiDBRecipe);
  },

  getRecipeByIdOrSlug: async (idOrSlug) => {
    let rows;
    if (isNaN(idOrSlug)) {
      [rows] = await getTiDBPool().query('SELECT * FROM recipes WHERE slug = ? LIMIT 1', [idOrSlug]);
    } else {
      [rows] = await getTiDBPool().query('SELECT * FROM recipes WHERE id = ? LIMIT 1', [Number(idOrSlug)]);
    }
    return rows[0] ? formatTiDBRecipe(rows[0]) : null;
  },

  getRecipesByCategory: async (category) => {
    const [rows] = await getTiDBPool().query('SELECT * FROM recipes WHERE category = ? ORDER BY rating DESC', [category]);
    return rows.map(formatTiDBRecipe);
  },

  // Collections
  getAllCollections: async () => {
    const [rows] = await getTiDBPool().query('SELECT * FROM collections ORDER BY id ASC');
    return rows;
  }
};

function formatTiDBRecipe(row) {
  let ingredients = row.ingredients;
  let steps = row.steps;
  let nutrition = row.nutrition;

  if (typeof ingredients === 'string') {
    try { ingredients = JSON.parse(ingredients); } catch (e) { ingredients = []; }
  }
  if (typeof steps === 'string') {
    try { steps = JSON.parse(steps); } catch (e) { steps = []; }
  }
  if (typeof nutrition === 'string') {
    try { nutrition = JSON.parse(nutrition); } catch (e) { nutrition = {}; }
  }

  return {
    ...row,
    single_pan: Boolean(row.single_pan),
    ingredients: ingredients || [],
    steps: steps || [],
    nutrition: nutrition || {}
  };
}

module.exports = {
  isTiDBConfigured,
  getTiDBPool,
  initTiDBDatabase,
  tidbQueries,
  getConnectionStatus: () => ({
    configured: isTiDBConfigured(),
    connected: isConnected,
    host: process.env.TIDB_HOST || null,
    database: process.env.TIDB_DATABASE || 'bachelor_bite'
  })
};
