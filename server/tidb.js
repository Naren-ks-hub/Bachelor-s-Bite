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

async function initTiDBDatabase() {
  if (!isTiDBConfigured()) {
    console.log('ℹ️  TiDB Cloud credentials not fully set in .env.local; using local database engine.');
    return false;
  }

  try {
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
    if (recipeRows[0].count === 0) {
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
        ]
      ];

      for (const r of initialRecipes) {
        await conn.query(`
          INSERT IGNORE INTO recipes (slug, title, badge, category, image, cook_time_min, budget_inr, difficulty, rating, single_pan, description, ingredients, steps, nutrition)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, r);
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
